import { useFilePicker } from "use-file-picker";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  MediaUploaderProps,
  PreviewFile,
} from "@ui-kit/ui/components/MediaUploader/types";

// Import necessary types and hooks
type MediaUploaderContextType = {
  openFilePicker?: () => void;
  maxFileSizeMB?: number;
  preview: PreviewFile[];
  handleRemoveFile: (index: number) => void;
};
// Create a context for the media uploader
export const mediaUploaderContext =
  createContext<MediaUploaderContextType | null>(null);

// MediaUploaderProvider component to provide context values
export const useMediaUploaderContext = () => {
  const context = useContext(mediaUploaderContext);
  if (!context) {
    throw new Error(
      "useMediaUploaderContext must be used within a MediaUploaderProvider",
    );
  }
  return context;
};

/**
 * MediaUploaderRoot component
 * @param onUpload // Callback function to handle file upload
 * @param maxFileSizeMB // Maximum file size in MB
 * @param accept // Accepted file types (MIME types)
 * @param children  // Child components to render within the MediaUploaderRoot
 * @constructor
 */
export const MediaUploaderRoot = ({
  onUpload,
  maxFileSizeMB = 5,
  accept = "image/*,video/*",
  children,
}: MediaUploaderProps) => {
  const [preview, setPreview] = useState<PreviewFile[]>([]);
  const [plains, setPlains] = useState<File[]>([]);

  // Callback function to handle files selected by the user
  const handleFilesSelected = useCallback(
    (files: { filesContent: PreviewFile[]; plainFiles: File[] }) => {
      const newPreview = preview.concat(files.filesContent);
      const newPlains = plains.concat(files.plainFiles);

      setPreview(newPreview);
      setPlains(newPlains);

      if (newPlains.length) {
        onUpload?.(newPlains);
      }
    },
    [onUpload, plains, preview],
  );

  // useFilePicker hook to handle file selection
  const { openFilePicker } = useFilePicker({
    accept,
    multiple: true,
    readAs: "DataURL",
    maxFileSize: maxFileSizeMB * 1024 * 1024,
    onFilesSuccessfullySelected: handleFilesSelected,
    onFilesRejected: (error) => {
      console.error("Error selecting files:", error);
    },
  });

  // Function to handle file removal
  const handleRemoveFile = useCallback(
    (index: number) => {
      const filterFiles = <T,>(arr: T[]) => arr.filter((_, i) => i !== index);
      setPreview(filterFiles);
      setPlains((prev) => {
        const newPlains = filterFiles(prev);
        setTimeout(() => {
          onUpload?.(newPlains);
        }, 0);
        return newPlains;
      });
    },
    [onUpload],
  );

  // To avoid unnecessary re-renders and performance issues by memoizing the context value
  const contextValue = useMemo(
    () => ({
      openFilePicker,
      handleRemoveFile,
      maxFileSizeMB,
      preview,
    }),
    [openFilePicker, handleRemoveFile, maxFileSizeMB, preview],
  );

  return (
    <mediaUploaderContext.Provider value={contextValue}>
      {children}
    </mediaUploaderContext.Provider>
  );
};
