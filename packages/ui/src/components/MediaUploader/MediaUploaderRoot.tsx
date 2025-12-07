// MediaUploaderRoot.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { MediaUploaderContext } from "./context";
import type { MediaUploaderProps, PreviewFile } from "./types";

export const MediaUploaderRoot: React.FC<MediaUploaderProps> = ({
  onUpload,
  maxFileSizeMB = 5,
  maxFileCount,
  accept, // 允许外面自定义；下面会给默认
  children,
}) => {
  const [preview, setPreview] = useState<PreviewFile[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles?.length) return;

      // 生成预览
      const droppedPreviewFiles: PreviewFile[] = acceptedFiles.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        preview: URL.createObjectURL(file),
      }));

      // 合并预览
      setPreview((prev) => {
        const merged = [...prev, ...droppedPreviewFiles];
        if (typeof maxFileCount === "number" && maxFileCount > 0) {
          return merged.slice(-maxFileCount);
        }
        return merged;
      });

      // 合并原始文件（只改本地 state，不在这里调用 onUpload）
      setFiles((prev) => {
        const merged = [...prev, ...acceptedFiles];
        if (typeof maxFileCount === "number" && maxFileCount > 0) {
          return merged.slice(-maxFileCount);
        }
        return merged;
      });
    },
    [maxFileCount],
  );

  const handleRemoveFile = useCallback((index: number) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ❗ 统一在 effect 里把 files 传给外层（RHF 的 field.onChange）
  useEffect(() => {
    if (onUpload) {
      onUpload(files);
    }
  }, [files, onUpload]);

  // 清理 URL.createObjectURL
  useEffect(() => {
    return () => {
      preview.forEach((p) => {
        if (p.preview) {
          URL.revokeObjectURL(p.preview);
        }
      });
    };
  }, [preview]);

  const dropzone = useDropzone({
    onDrop,
    accept:
      accept ??
      ({
        "image/*": [],
        "video/*": [],
      } as any),
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
      openFilePicker: dropzone.open,
    }),
    [dropzone, preview, handleRemoveFile, maxFileSizeMB, maxFileCount],
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
