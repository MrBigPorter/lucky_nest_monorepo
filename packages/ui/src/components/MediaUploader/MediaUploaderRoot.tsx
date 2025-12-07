// MediaUploaderRoot.tsx
import React, { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { MediaUploaderContext } from "./context";
import type { MediaUploaderProps, PreviewFile } from "./types";

export const MediaUploaderRoot: React.FC<MediaUploaderProps> = ({
  onUpload,
  maxFileSizeMB = 5,
  maxFileCount,
  accept = { "image/*": [], "video/*": [] },
  children,
}) => {
  const [preview, setPreview] = useState<PreviewFile[]>([]);
  const [plains, setPlains] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles?.length) return;

      const droppedPreviewFiles: PreviewFile[] = acceptedFiles.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        // 关键字段，预览用
        preview: URL.createObjectURL(file),
      }));

      // 预览数组
      setPreview((prev) => {
        const merged = [...prev, ...droppedPreviewFiles];
        // 有 maxFileCount 时，只保留最后 N 个
        if (typeof maxFileCount === "number" && maxFileCount > 0) {
          return merged.slice(-maxFileCount);
        }
        return merged;
      });

      // 原始 File 数组，同步给外面（比如 RHF 的 field.onChange）
      setPlains((prev) => {
        const merged = [...prev, ...acceptedFiles];

        const limited =
          typeof maxFileCount === "number" && maxFileCount > 0
            ? merged.slice(-maxFileCount)
            : merged;

        onUpload?.(limited);
        return limited;
      });
    },
    [onUpload, maxFileCount],
  );

  const handleRemoveFile = useCallback(
    (index: number) => {
      setPreview((prev) => prev.filter((_, i) => i !== index));
      setPlains((prev) => {
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
    maxFiles: maxFileCount,
    noClick: true,
    noKeyboard: true,
  });

  const contextValue = useMemo(
    () => ({
      dropzone,
      preview,
      handleRemoveFile,
      maxFileSizeMB,
      maxFileCount,
      // 给子组件用的「打开文件框」方法
      openFilePicker: dropzone.open,
    }),
    [dropzone, preview, handleRemoveFile, maxFileSizeMB, maxFileCount],
  );

  return (
    <MediaUploaderContext.Provider value={contextValue}>
      {/* root 只负责拖拽区域，不再负责 click 打开 */}
      <div {...dropzone.getRootProps()}>
        <input {...dropzone.getInputProps()} />
        {children}
      </div>
    </MediaUploaderContext.Provider>
  );
};
