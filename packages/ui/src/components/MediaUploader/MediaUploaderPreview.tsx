// MediaUploaderPreview.tsx
import React from "react";
import { X } from "lucide-react";
import { useMediaUploaderContext } from "./context";
import type { RenderItemProps } from "./types";
import { MediaUploaderButton } from "./MediaUploaderButton";
import { cn } from "../../lib/utils";

interface MediaUploaderPreviewProps {
  className?: string;
  showRemoveButton?: boolean;
  renderItem?: (props: RenderItemProps) => React.ReactNode;
  renderButton?: (openFilePicker?: () => void) => React.ReactNode;
}

export const MediaUploaderPreview: React.FC<MediaUploaderPreviewProps> = ({
  className,
  showRemoveButton = true,
  renderItem,
  renderButton,
}) => {
  const { preview, handleRemoveFile, openFilePicker, maxFileCount } =
    useMediaUploaderContext();

  // 0 张：只显示上传按钮
  if (!preview.length) {
    if (renderButton) {
      return (
        <div className={cn("w-full", className)}>
          {renderButton(openFilePicker)}
        </div>
      );
    }
    return (
      <div className={cn("w-full", className)}>
        <MediaUploaderButton />
      </div>
    );
  }

  // MediaUploaderPreview.tsx 单张预览分支里改：
  if (preview.length === 1 && maxFileCount === 1 && !renderItem) {
    const file = preview[0];
    const isImage = file.type.startsWith("image/");

    return (
      <div className={cn("w-full", className)}>
        <div
          className="relative group w-full h-52 md:h-64 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-black/5 dark:bg白/5 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation(); // ⭐ 关键：不要让事件冒泡到 getRootProps 的 div
            openFilePicker?.();
          }}
        >
          {isImage ? (
            <img
              src={file.preview}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              src={file.preview}
              controls
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>
    );
  }

  // 多张：网格展示 + 下面可选继续上传按钮
  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {preview.map((file, index) => {
          if (renderItem) {
            return renderItem({
              file,
              index,
              handleRemoveFile,
              showRemoveButton,
            });
          }

          const isImage = file.type.startsWith("image/");

          return (
            <div
              key={file.id}
              className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 bg-black/5 dark:bg-white/5"
            >
              {isImage ? (
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={file.preview}
                  controls
                  className="w-full h-full object-cover"
                />
              )}

              {showRemoveButton && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  className="absolute z-10 top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={16} />
                </button>
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[11px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                {file.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* 多图时可以在下方再来一个“继续上传”按钮（可自定义） */}
      {renderButton && (
        <div className="pt-1 flex justify-end">
          {renderButton(openFilePicker)}
        </div>
      )}
    </div>
  );
};
