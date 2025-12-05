import React from "react";

export type BaseSelectOptionProps = {
  label: string;
  value: string;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
};

export type GroupSelectOptionProps = {
  groupName?: string;
  key?: string;
  options: BaseSelectOptionProps[];
};

export type BaseSelectProps = {
  value?: string;
  options: GroupSelectOptionProps[];
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
