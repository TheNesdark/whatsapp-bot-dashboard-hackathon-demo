
import type { Request, Response } from 'express';
import { validateImageBuffer } from '@server/utils/files';
import type { UploadedImageFile } from '@server/types';

type RequestWithImage = Request & {
  file?: UploadedImageFile;
};

export function getUploadedImage(req: Request): UploadedImageFile | undefined {
  return (req as RequestWithImage).file;
}

export function getValidatedUploadedImage(
  req: Request,
  res: Response,
  invalidMessage: string,
): UploadedImageFile | null {
  const file = getUploadedImage(req);
  if (!file?.buffer) {
    return null;
  }

  if (!validateImageBuffer(file.buffer)) {
    res.status(400).json({ error: invalidMessage });
    return null;
  }

  return file;
}
