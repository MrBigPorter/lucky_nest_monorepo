import React from "react";
// Import necessary types and hooks
export type MediaUploaderProps = {
  onUpload?: (file: File[]) => void;
  className?: string;
  maxFileSizeMB?: number;
  accept?: string;
  maxFileCount?: number;
  children: React.ReactNode;
};
// Type definition for preview files
export type PreviewFile = {
  name: string;
  path: string;
  size: number;
  type: string;
  lastModified: number;
  content: string;
};
// Type definition for the render item props used in MediaUploaderPreview
export type RenderItemProps = {
  file: PreviewFile;
  index: number;
  handleRemoveFile: (index: number) => void;
  showRemoveButton: boolean;
};
