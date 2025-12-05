import React from "react";

export interface ModalProps {
  title?: string | React.ReactNode;
  content?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  renderChildren?: React.ReactNode;
  onFinishClose?: () => void;
  showClose?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
