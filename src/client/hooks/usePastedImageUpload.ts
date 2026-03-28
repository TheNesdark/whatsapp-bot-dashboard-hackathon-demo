import { useEffect, useState } from 'react';

function buildPastedImageFile(item: DataTransferItem, file: File): File {
  const ext = item.type.split('/')[1] || 'png';
  return new File([file], `pasted-image.${ext}`, { type: item.type });
}

export function usePastedImageUpload(enabled = true) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const setImageFile = (file: File | null) => {
    setImage(file);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const clearImage = () => {
    setImageFile(null);
  };

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    if (!enabled) return;

    const handler = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (!item.type.startsWith('image/')) continue;

        const file = item.getAsFile();
        if (file) {
          setImageFile(buildPastedImageFile(item, file));
          event.preventDefault();
        }
        break;
      }
    };

    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, [enabled]);

  return {
    image,
    preview,
    setImageFile,
    clearImage,
  };
}
