// context.ts
import { createContext, useContext } from "react";
import type { DropzoneState } from "react-dropzone";
import type { PreviewFile } from "./types";

interface MediaUploaderContextType {
  dropzone: DropzoneState;
  preview: PreviewFile[];
  handleRemoveFile: (index: number) => void;
  maxFileSizeMB?: number;
  maxFileCount?: number;
  openFilePicker?: () => void;
}

export const MediaUploaderContext =
  createContext<MediaUploaderContextType | null>(null);

export const useMediaUploaderContext = () => {
  const context = useContext(MediaUploaderContext);
  if (!context) {
    throw new Error(
      "useMediaUploaderContext must be used within a MediaUploaderRoot component",
    );
  }
  return context;
};
