import { AddIcon } from "@storybook/icons";
import { useMediaUploaderContext } from "@ui-kit/ui/components/MediaUploader/MediaUploaderRoot";
import { cn } from "@utils";
import React from "react";

type MediaUploaderButton = {
  testId?: string; // Optional test ID for testing purposes
  onClick?: () => void; // Optional click handler for the button
  className?: string; // Optional className for custom styling
  children?: React.ReactNode; // Optional children to render inside the button
};
/**
 * Button component for media uploader
 * @param onClick // Optional click handler for the button
 * @param className // Optional className for custom styling
 * @param children // Optional children to render inside the button
 * @param testId // Optional test ID for testing purposes, useful for e2e tests
 * @constructor
 */
export const MediaUploaderButton = ({
  onClick,
  className = "",
  children,
  testId,
}: MediaUploaderButton) => {
  const { openFilePicker } = useMediaUploaderContext();
  return (
    <button
      data-testid={`${testId}-media-uploader-button`}
      type="button"
      className={cn(
        "w-[100px] h-[100px] bg-gray-200 rounded-[10px] flex justify-center items-center hover:bg-gray-300 transition-colors",
        className,
      )}
      onClick={onClick ?? openFilePicker}
    >
      {children || <AddIcon width={24} height={24} />}
    </button>
  );
};
