'use client';
import { uploadImage } from '@client/src/api/upload';

export interface UploadFileData {
  id: string;
  filePath: string;
  bucketId: string;
  url: string;
}

export async function uploadFile(file: File): Promise<UploadFileData> {
  const url = await uploadImage(file, file.name);

  return {
    id: url,
    filePath: url,
    bucketId: 'weiji-images',
    url,
  };
}
