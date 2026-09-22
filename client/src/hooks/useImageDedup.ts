import { useCallback, useRef } from 'react';
import MD5 from 'crypto-js/md5';
import WordArray from 'crypto-js/lib-typedarrays';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  queryImageDedup,
  registerImageDedup,
} from '@client/src/api/data';

const HASH_CACHE = new Map<string, string>();

function calculateFileHash(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const wordArray = WordArray.create(reader.result as ArrayBuffer);
        const hash = MD5(wordArray).toString();
        resolve(hash);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export function useImageDedup() {
  const pendingCache = useRef<Map<string, Promise<string | null>>>(
    new Map(),
  );

  const checkAndReuse = useCallback(
    async (file: File | Blob): Promise<string | null> => {
      try {
        const hash = await calculateFileHash(file);

        const cached = HASH_CACHE.get(hash);
        if (cached) {
          logger.info('[image-dedup] 命中本地缓存');
          return cached;
        }

        const pending = pendingCache.current.get(hash);
        if (pending) return pending;

        const promise = (async () => {
          try {
            const result = await queryImageDedup(hash);
            if (result.exists && result.downloadUrl) {
              HASH_CACHE.set(hash, result.downloadUrl);
              logger.info('[image-dedup] 命中服务端去重');
              return result.downloadUrl;
            }
            return null;
          } catch (err) {
            logger.warn('[image-dedup] 查询去重失败，继续上传', err);
            return null;
          } finally {
            pendingCache.current.delete(hash);
          }
        })();

        pendingCache.current.set(hash, promise);
        return promise;
      } catch (err) {
        logger.warn('[image-dedup] 计算hash失败，继续上传', err);
        return null;
      }
    },
    [],
  );

  const registerUploadedImage = useCallback(
    async (
      file: File | Blob,
      fileName: string,
      downloadUrl: string,
    ): Promise<void> => {
      try {
        const hash = await calculateFileHash(file);
        HASH_CACHE.set(hash, downloadUrl);

        registerImageDedup({
          fileHash: hash,
          fileName,
          downloadUrl,
          fileSize: file.size,
        }).catch((err) => {
          logger.warn('[image-dedup] 登记去重记录失败', err);
        });
      } catch (err) {
        logger.warn('[image-dedup] 登记时计算hash失败', err);
      }
    },
    [],
  );

  return {
    checkAndReuse,
    registerUploadedImage,
  };
}
