// types.ts
import React from "react";
import type { Accept } from "react-dropzone";

export type MediaUploaderProps = {
  /** RHF 那边传来的当前值，用于回显（可以是 string | File | File[]） */
  value?: unknown;
  /** 选中文件后回调，统一返回 File[] 给外面（RHF 那边自己处理单/多） */
  onUpload?: (files: File[]) => void;
  className?: string;
  maxFileSizeMB?: number;
  /** 透传给 react-dropzone，可以传 string 或 Accept 对象 */
  accept?: Accept | string;
  maxFileCount?: number;
  children: React.ReactNode;
};

/** 用于预览层的文件结构 */
export type PreviewFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  /** 用于 <img src> / <video src> 的预览 URL */
  preview: string;
  /** 是否是接口返回的旧数据（URL 回显） */
  fromServer?: boolean;
};

export type RenderItemProps = {
  file: PreviewFile;
  index: number;
  handleRemoveFile: (index: number) => void;
  showRemoveButton: boolean;
};

export interface RenderImageProps {
  src: string;
  alt?: string;
  className?: string;
  file: PreviewFile; // 把原始 file 对象也传出去，方便外部做判断
}
