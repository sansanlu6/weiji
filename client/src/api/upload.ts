import { apiClient } from '@client/src/utils/api-client';
import { isAxiosError } from 'axios';

interface UploadImageResponse {
  downloadUrl: string;
  objectPath: string;
}

const MAX_IMAGE_EDGE = 1600;
const JPEG_QUALITY = 0.8;
const COMPRESSION_THRESHOLD = 450 * 1024;

async function compressImage(file: File): Promise<File> {
  if (file.type === 'image/gif' || file.size <= COMPRESSION_THRESHOLD) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('无法读取图片'));
      element.src = objectUrl;
    });

    const scale = Math.min(
      1,
      MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return file;

    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const compressed = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY);
    });
    if (!compressed || compressed.size >= file.size) return file;

    const compressedName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([compressed], compressedName, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function uploadImage(
  image: File | Blob,
  fileName: string,
): Promise<string> {
  const file = image instanceof File
    ? image
    : new File([image], fileName, {
        type: image.type || 'image/jpeg',
      });

  const optimizedFile = await compressImage(file);
  const formData = new FormData();
  formData.append('file', optimizedFile);

  let data: UploadImageResponse;
  try {
    const response = await apiClient.post<UploadImageResponse>(
      'api/upload/image',
      formData,
      { timeout: 30_000 },
    );
    data = response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const message = error.response?.data?.error?.message;
      if (typeof message === 'string' && message) {
        throw new Error(message);
      }
    }
    throw error;
  }

  if (!data?.downloadUrl) {
    throw new Error('服务器未返回图片地址');
  }

  return data.downloadUrl;
}
