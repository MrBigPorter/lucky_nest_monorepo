import React from "react";
import type { ButtonVariant } from "../../../button.tsx";

export type SwipeAction<T> = {
  label: string;
  icons?: React.ReactNode;
  onClick?: (item: T & { index: number }) => void;
  onCancel?: () => void;
  className?: string;
  variant?: ButtonVariant;
};
export type SwipeableItemProps<T> = {
  children: React.ReactNode;
  actions: SwipeAction<T>[];
  threshold?: number;
  onSwipeAction?: () => void;
  disabled?: boolean;
  itemIndex?: number;
  item?: T;
  className?: string;
};
