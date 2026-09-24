import { apiClient } from '@client/src/utils/api-client';
import { isAxiosError } from 'axios';

interface UploadImageResponse {
  downloadUrl: string;
  objectPath: string;
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

  const formData = new FormData();
  formData.append('file', file);

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
