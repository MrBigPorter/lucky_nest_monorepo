// MediaUploaderButton.tsx
import React from "react";
import { UploadCloud } from "lucide-react";
import { useMediaUploaderContext } from "./context";
import { cn } from "../../../lib/utils";

interface MediaUploaderButtonProps {
  className?: string;
}

export const MediaUploaderButton: React.FC<MediaUploaderButtonProps> = ({
  className,
}) => {
  const { dropzone, maxFileSizeMB, maxFileCount } = useMediaUploaderContext();
  const { isDragActive, open } = dropzone;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        open();
      }}
      className={cn(
        "w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-colors cursor-pointer",
        isDragActive
          ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-500"
          : "border-gray-300 dark:border-white/10 text-gray-400 hover:border-primary-500 hover:text-primary-500",
        className,
      )}
    >
      <UploadCloud className="w-10 h-10 mb-2" />
      <p className="text-sm font-medium">
        {isDragActive ? "Drop files here..." : "Click or drag files to upload"}
      </p>
      <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
        PNG / JPG / GIF
        {maxFileSizeMB && ` · up to ${maxFileSizeMB}MB`}
        {maxFileCount && ` · max ${maxFileCount} files`}
      </p>
    </button>
  );
};
