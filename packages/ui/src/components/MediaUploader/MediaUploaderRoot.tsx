import React, { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { MediaUploaderContext } from './context.ts';
import { MediaUploaderProps, PreviewFile } from './types.ts';

export const MediaUploaderRoot: React.FC<MediaUploaderProps> = ({
  onUpload,
  maxFileSizeMB = 5,
  accept = { 'image/*': [], 'video/*': [] },
  children,
}) => {
  const [preview, setPreview] = useState<PreviewFile[]>([]);
  const [plains, setPlains] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newPreviewFiles = acceptedFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      preview: URL.createObjectURL(file),
    }));

    setPreview(prev => [...prev, ...newPreviewFiles]);
    setPlains(prev => {
      const newPlains = [...prev, ...acceptedFiles];
      onUpload?.(newPlains);
      return newPlains;
    });
  }, [onUpload]);

  const handleRemoveFile = useCallback(
    (index: number) => {
      setPreview(prev => prev.filter((_, i) => i !== index));
      setPlains(prev => {
        const newPlains = prev.filter((_, i) => i !== index);
        onUpload?.(newPlains);
        return newPlains;
      });
    },
    [onUpload],
  );

  const dropzone = useDropzone({
    onDrop,
    accept,
    maxSize: maxFileSizeMB * 1024 * 1024,
  });

  const contextValue = useMemo(
    () => ({
      dropzone,
      preview,
      handleRemoveFile,
      maxFileSizeMB,
    }),
    [dropzone, preview, handleRemoveFile, maxFileSizeMB],
  );

  return (
    <MediaUploaderContext.Provider value={contextValue}>
      <div {...dropzone.getRootProps()}>
        <input {...dropzone.getInputProps()} />
        {children}
      </div>
    </MediaUploaderContext.Provider>
  );
};
