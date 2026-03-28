import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ALLOWED_IMAGE_MIME_TYPES } from '@server/utils/files';

// Para permitir trabajar con el buffer en memoria en lugar de escribir
// el archivo en disco cambiamos a memoryStorage. el buffer llega en
// `req.file.buffer` y ya no hace falta limpiar archivos temporales.
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)
            ? cb(null, true)
            : cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes.') as any, false);
    },
});

export function multerErrorHandler(err: any, _req: Request, res: Response, next: NextFunction): void {
    if (!err) { next(); return; }
    if (err instanceof multer.MulterError) {
        res.status(400).json({
            error: err.code === 'LIMIT_FILE_SIZE'
                ? 'La imagen excede el tamaño máximo de 10 MB'
                : err.message,
        });
        return;
    }
    if (err?.message?.includes('Tipo de archivo no permitido')) {
        res.status(400).json({ error: err.message });
        return;
    }
    next(err);
}