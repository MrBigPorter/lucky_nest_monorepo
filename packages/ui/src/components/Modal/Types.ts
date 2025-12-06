import React from "react";

type RenderChildren =
  | React.ReactNode
  | ((helpers: { close: () => void }) => React.ReactNode);

export interface ModalProps {
  title?: string | React.ReactNode;
  content?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  renderChildren?: RenderChildren;
  onFinishClose?: () => void;
  showClose?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}
