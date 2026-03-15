import { useMemo, useRef, useCallback } from "react";
import { Controller, useFormContext } from "react-hook-form";
import ReactQuill from "react-quill-new";
// CSS is imported by the consuming app (apps/admin-next/src/app/layout.tsx)
// to avoid side-effect imports in pre-built library bundles.
import { twMerge } from "tailwind-merge";

interface FormRichTextFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  //必须传入一个上传函数
  // 接收 File，返回 Promise<string> (即图片URL)
  onUpload?: (file: File) => Promise<string>;
}

export const FormRichTextField = ({
  name,
  label,
  placeholder,
  required,
  className,
  onUpload,
}: FormRichTextFieldProps) => {
  const { control } = useFormContext();
  const quillRef = useRef<ReactQuill>(null);

  // 自定义图片处理逻辑
  const imageHandler = useCallback(() => {
    // 1. 如果没传 onUpload 方法，就报错或者什么都不做
    if (!onUpload) {
      alert("Image upload configuration is missing!");
      return;
    }

    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // 简单的大小检查，也可以移到外面去
      if (file.size > 5 * 1024 * 1024) {
        alert("Image too large (max 5MB)");
        return;
      }

      try {
        //  2. 调用父组件传进来的方法
        // 组件只管拿 URL，不管你是调 API 还是上传到 AWS
        const url = await onUpload(file);

        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, "image", url);
          quill.setSelection(range.index + 1, 0);
        }
      } catch (error) {
        console.error("Upload failed in component:", error);
        alert("Failed to upload image");
      }
    };
  }, [onUpload]);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: imageHandler, // 绑定处理器
        },
      },
    }),
    [imageHandler],
  );

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div className={twMerge("w-full flex flex-col gap-1.5", className)}>
          {label && (
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
          )}

          <div
            className={twMerge(
              "group flex flex-col bg-gray-50 dark:bg-black/20 border rounded-lg overflow-hidden transition-all",
              error ? "border-red-500" : "border-gray-200 dark:border-gray-800",
            )}
          >
            {/* 通过 style 强制控制高度，防止工具栏被顶走 */}
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={field.value || ""}
              onChange={field.onChange}
              placeholder={placeholder}
              modules={modules}
              style={{
                height: "300px",
                display: "flex",
                flexDirection: "column",
              }}
              className="flex-1"
            />
          </div>

          {/* 这里需要一段 CSS 来配合，见下文 */}

          {error && (
            <span className="text-xs text-red-500">{error.message}</span>
          )}
        </div>
      )}
    />
  );
};
