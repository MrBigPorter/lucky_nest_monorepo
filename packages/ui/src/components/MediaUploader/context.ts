// context.ts
import { createContext, useContext } from "react";
import { DropzoneState } from "react-dropzone";
import { PreviewFile } from "./types.ts";

interface MediaUploaderContextType {
  dropzone: DropzoneState;
  preview: PreviewFile[];
  handleRemoveFile: (index: number) => void;
  maxFileSizeMB?: number;
  openFilePicker?: () => void;
  maxFileCount?: number;
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
