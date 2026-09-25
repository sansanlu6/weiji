const SUPABASE_PUBLIC_OBJECT_MARKER =
  '/storage/v1/object/public/weiji-images/';
const STORAGE_OBJECT_PATH_PATTERN =
  /^(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.(?:jpe?g|png|webp|gif)$/i;

/**
 * 手机网络直连 Supabase CDN 可能很慢。旧记录仍保存 Supabase 公网地址，
 * 在显示时将其转换为本站图片代理；新记录会直接保存本站相对地址。
 */
export function resolveImageUrl(src: string): string {
  const normalizedSrc = src.trim();
  if (!normalizedSrc || normalizedSrc.startsWith('/api/upload/image/')) {
    return normalizedSrc;
  }

  // 兼容早期迁移到 Supabase 时只在数据库保存了对象文件名
  // （例如 1876813578438985.jpg）的记录。这类地址也应走本站图片代理。
  if (STORAGE_OBJECT_PATH_PATTERN.test(normalizedSrc)) {
    return `/api/upload/image/${normalizedSrc}`;
  }

  // 兼容“/文件名”格式，但不影响 /assets/... 等真正的本地素材。
  const rootObjectPath = normalizedSrc.match(/^\/([^/]+)$/)?.[1];
  if (rootObjectPath && STORAGE_OBJECT_PATH_PATTERN.test(rootObjectPath)) {
    return `/api/upload/image/${rootObjectPath}`;
  }

  try {
    const url = new URL(normalizedSrc);
    const decodedPath = decodeURIComponent(url.pathname).replace(/^\/+/, '');

    // 兼容旧数据中保存的“本站完整 URL + 根目录文件名”。
    if (
      typeof window !== 'undefined' &&
      url.origin === window.location.origin &&
      !decodedPath.includes('/') &&
      STORAGE_OBJECT_PATH_PATTERN.test(decodedPath)
    ) {
      return `/api/upload/image/${decodedPath}`;
    }

    const markerIndex = url.pathname.indexOf(SUPABASE_PUBLIC_OBJECT_MARKER);
    if (!url.hostname.endsWith('.supabase.co') || markerIndex < 0) {
      return normalizedSrc;
    }

    const objectPath = url.pathname.slice(
      markerIndex + SUPABASE_PUBLIC_OBJECT_MARKER.length,
    );
    return objectPath
      ? `/api/upload/image/${objectPath}`
      : normalizedSrc;
  } catch {
    return normalizedSrc;
  }
}
