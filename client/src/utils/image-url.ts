const SUPABASE_PUBLIC_OBJECT_MARKER =
  '/storage/v1/object/public/weiji-images/';

/**
 * 手机网络直连 Supabase CDN 可能很慢。旧记录仍保存 Supabase 公网地址，
 * 在显示时将其转换为本站图片代理；新记录会直接保存本站相对地址。
 */
export function resolveImageUrl(src: string): string {
  if (!src || src.startsWith('/api/upload/image/')) return src;

  try {
    const url = new URL(src);
    const markerIndex = url.pathname.indexOf(SUPABASE_PUBLIC_OBJECT_MARKER);
    if (!url.hostname.endsWith('.supabase.co') || markerIndex < 0) {
      return src;
    }

    const objectPath = url.pathname.slice(
      markerIndex + SUPABASE_PUBLIC_OBJECT_MARKER.length,
    );
    return objectPath ? `/api/upload/image/${objectPath}` : src;
  } catch {
    return src;
  }
}
