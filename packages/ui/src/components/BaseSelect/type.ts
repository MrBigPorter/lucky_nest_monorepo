import React from "react";
import { BaseSelectOptions } from "./index.tsx";

export type BaseSelectProps = {
  value?: string;
  options: BaseSelectOptions;
  onChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "error" | "success" | "warning";
  triggerClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
  separatorClassName?: string;
  showSeparator?: boolean;
  itemIndicator?: React.ReactNode;
  triggerIcon?: React.ReactNode;
  testId?: string;
};
