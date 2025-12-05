import React from "react";
import { twMerge } from "tailwind-merge";

/**
 * Props for HelpText component.
 * @property content - The help text content, can be a string or React node.
 */
interface HelpProps {
  content?: string | React.ReactNode;
  className?: string;
  testId?: string;
}
export const HelpText = ({ content, className, testId }: HelpProps) => {
  if (!content) return null;
  if (typeof content === "string") {
    return (
      <p
        data-testid={testId}
        className={twMerge("w-full text-[14rem] text-gray-500", className)}
      >
        {content}
      </p>
    );
  }
  return <>{content}</>;
};
