// MediaUploaderRoot.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone, type Accept } from "react-dropzone";
import { MediaUploaderContext } from "./context";
import type { MediaUploaderProps, PreviewFile } from "./types";

export const MediaUploaderRoot: React.FC<MediaUploaderProps> = ({
  value, // ⭐ 用于表单回显
  onUpload,
  maxFileSizeMB = 5,
  maxFileCount,
  accept,
  children,
}) => {
  const [preview, setPreview] = useState<PreviewFile[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  /** -------- 1. 把默认值（URL / File）转成 preview，用于编辑回显 -------- */
  useEffect(() => {
    // 没值：清空
    if (!value) {
      setPreview([]);
      setFiles([]);
      return;
    }

    const urlList: string[] = [];
    const fileList: File[] = [];

    if (value instanceof File) {
      fileList.push(value);
    } else if (Array.isArray(value)) {
      for (const v of value) {
        if (v instanceof File) fileList.push(v);
        else if (typeof v === "string" && v) urlList.push(v);
      }
    } else if (typeof value === "string" && value) {
      urlList.push(value);
    }

    // 已经有用户交互产生的 preview，就不强制覆盖，避免闪动
    if (!urlList.length && !fileList.length) return;
    if (preview.length > 0) return;

    const fromUrl: PreviewFile[] = urlList.map((u, idx) => ({
      id: `url-${idx}`,
      name: u.split("/").pop() || `image-${idx + 1}`,
      size: 0,
      type: "image/*",
      preview: u,
      fromServer: true,
    }));

    const fromFile: PreviewFile[] = fileList.map((f, idx) => ({
      id: `file-${idx}`,
      name: f.name,
      size: f.size,
      type: f.type,
      preview: URL.createObjectURL(f),
      fromServer: false,
    }));

    let merged = [...fromUrl, ...fromFile];
    if (maxFileCount && maxFileCount > 0) {
      merged = merged.slice(-maxFileCount);
    }

    setPreview(merged);
    setFiles(fileList.slice(-(maxFileCount ?? fileList.length)));
  }, [value, maxFileCount, preview.length]);

  /** -------- 2. 处理 accept -------- */
  const internalAccept: Accept | undefined =
    typeof accept === "string" || !accept
      ? { "image/*": [], "video/*": [] }
      : accept;

  /** -------- 3. 拖拽 / 选择文件 -------- */
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles?.length) return;

      const newPreview: PreviewFile[] = acceptedFiles.map((file, index) => ({
        id: `local-${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: URL.createObjectURL(file),
        fromServer: false,
      }));

      setPreview((prev) => {
        // 选中新的图片时，把旧的 server 回显也可以保留或不保留
        // 这里我选择保留旧的 + 新的，再按 maxFileCount 截断
        const merged = [...prev, ...newPreview];
        if (maxFileCount && maxFileCount > 0) {
          return merged.slice(-maxFileCount);
        }
        return merged;
      });

      setFiles((prev) => {
        const merged = [...prev, ...acceptedFiles];
        const limited =
          maxFileCount && maxFileCount > 0
            ? merged.slice(-maxFileCount)
            : merged;
        // ⭐ 只在这里调用 onUpload -> 只在用户操作时更新 RHF，不在 render 期间调用
        onUpload?.(limited);
        return limited;
      });
    },
    [onUpload, maxFileCount],
  );

  /** -------- 4. 删除某一张 -------- */
  const handleRemoveFile = useCallback(
    (index: number) => {
      setPreview((prev) => prev.filter((_, i) => i !== index));
      setFiles((prev) => {
        const next = prev.filter((_, i) => i !== index);
        onUpload?.(next);
        return next;
      });
    },
    [onUpload],
  );

  const dropzone = useDropzone({
    onDrop,
    accept: internalAccept,
    maxSize: maxFileSizeMB * 1024 * 1024,
    maxFiles: maxFileCount,
    multiple: !maxFileCount || maxFileCount > 1,
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
      {/* 这里只负责绑定 dropzone 的 root/input，样式交给 Preview/Button */}
      <div {...dropzone.getRootProps()}>
        <input {...dropzone.getInputProps()} />
        {children}
      </div>
    </MediaUploaderContext.Provider>
  );
};
