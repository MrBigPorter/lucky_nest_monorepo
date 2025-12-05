import { X } from "lucide-react";
import {
  PreviewFile,
  RenderItemProps,
} from "@ui-kit/ui/components/MediaUploader/types";
import { useMediaUploaderContext } from "@ui-kit/ui/components/MediaUploader/MediaUploaderRoot";
import React, { ReactNode } from "react";
import { cn } from "@utils";

// Props interface for MediaPreviewItem component
type MediaPreviewItemProps = {
  file: PreviewFile;
  index: number;
  handleRemoveFile: (index: number) => void;
  showRemoveButton?: boolean; // Optional prop to control visibility of the remove button
  testId?: string; // Optional test ID for testing purposes
};

/**
 * Component to render a single media preview item
 * @param file // The file object containing the media data
 * @param index // The index of the file in the preview list
 * @param handleRemoveFile // Function to handle removing the file from the preview
 * @param showRemoveButton // Optional prop to control visibility of the remove button
 * @param testId // Optional test ID for testing purposes, useful for e2e tests
 * @constructor
 */
const MediaPreviewItem = ({
  file,
  index,
  handleRemoveFile,
  showRemoveButton = true,
  testId,
}: MediaPreviewItemProps) => {
  return (
    <div key={`${file.name}-${index}`} className="relative">
      {/* Media preview container */}
      <div className="w-[100px] h-[100px] bg-gray-200 rounded-[10px] overflow-hidden">
        {file.type.startsWith("image/") ? (
          // Image preview
          // eslint-disable-next-line @next/next/no-img-element
          <img
            data-testid={`${testId}-media-uploader-preview-img-${file.name}-${index}`}
            src={file.content}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          // Video preview
          <video
            data-testid={`${testId}-media-uploader-preview-video-${file.name}-${index}`}
            muted
            playsInline
            autoPlay
            className="w-full h-full object-cover"
          >
            <source src={file.content} type={file.type} />
            Your browser does not support the video tag.
          </video>
        )}
      </div>

      {/* Remove button */}
      {showRemoveButton && (
        <button
          data-testid={`${testId}-media-uploader-remove-button-${index}`}
          type="button"
          className="w-[20px] h-[20px] absolute -top-[10px] -right-[5px] z-50 rounded-full bg-gray-300 flex justify-center items-center hover:bg-gray-400 transition-colors"
          onClick={() => handleRemoveFile(index)}
          title="Remove file"
        >
          <X className="text-white" width={15} height={15} />
        </button>
      )}
    </div>
  );
};

export type MediaUploaderPreviewProps = {
  testId?: string; // Optional test ID for testing purposes
  renderButton?: (openFilePicker: (() => void) | undefined) => ReactNode; // Optional button to render when the maximum file count is not reached
  className?: string; // Optional className for custom styling
  renderItem?: ({
    file,
    index,
    handleRemoveFile,
    showRemoveButton,
  }: RenderItemProps) => React.ReactNode; // Optional function to render custom preview items
  showRemoveButton?: boolean; // Optional prop to control visibility of the remove button
};
/**
 * MediaUploaderPreview component
 * @param renderButton // Optional button to render when the maximum file count is not reached
 * @param className // Optional className for custom styling
 * @param renderItem // Optional function to render custom preview items
 * @param showRemoveButton // Optional prop to control visibility of the remove button
 * @param testId // Optional test ID for testing purposes, useful for e2e tests
 * @constructor
 */

export const MediaUploaderPreview = ({
  renderButton,
  className = "",
  renderItem,
  showRemoveButton = true,
  testId, // Optional test ID for testing purposes
}: MediaUploaderPreviewProps) => {
  const { preview, handleRemoveFile, openFilePicker } =
    useMediaUploaderContext();

  return (
    <div
      data-testid={`${testId}-media-uploader-preview`}
      className={cn(
        "flex flex-wrap gap-2 justify-start items-start",
        className,
      )}
    >
      {preview.map((file, index) =>
        renderItem ? (
          // Use custom render function if provided
          renderItem({ file, index, handleRemoveFile, showRemoveButton })
        ) : (
          // Default rendering of media preview item
          <MediaPreviewItem
            testId={testId}
            key={`${file.name}-${index}`}
            file={file}
            index={index}
            showRemoveButton={showRemoveButton}
            handleRemoveFile={handleRemoveFile}
          />
        ),
      )}
      {renderButton?.(openFilePicker)}
    </div>
  );
};
