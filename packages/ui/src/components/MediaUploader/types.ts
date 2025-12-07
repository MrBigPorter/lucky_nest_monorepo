import React from "react";
import type { Accept } from "react-dropzone";

// 组件根节点的 props
export interface MediaUploaderProps {
  onUpload?: (files: File[]) => void;
  className?: string;
  maxFileSizeMB?: number;
  /**
   * 和 react-dropzone 一致的 Accept 类型：
   * { "image/*": [], "video/*": [] }
   */
  accept?: Accept;
  maxFileCount?: number;
  children?: React.ReactNode;
}

// 预览用的文件结构
export interface PreviewFile {
  name: string;
  size: number;
  type: string;
  /**
   * 预览地址：URL.createObjectURL(file)
   */
  preview: string;
  // 下面两个可选，要用可以填，不用就算了
  path?: string;
  lastModified?: number;
}

// Preview 里每一项 render 时的 props
export interface RenderItemProps {
  file: PreviewFile;
  index: number;
  handleRemoveFile: (index: number) => void;
  showRemoveButton: boolean;
}
