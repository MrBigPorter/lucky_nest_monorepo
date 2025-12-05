import React from "react";

export type SwipeAction<T> = {
  label: string;
  icons?: React.ReactNode;
  onClick?: (item: T & { index: number }) => void;
  onCancel?: () => void;
  className?: string;
  variant?: "destructive" | "default" | "custom";
};
export type SwipeableItemProps<T> = {
  children: React.ReactNode;
  actions: SwipeAction<T>[];
  threshold: number;
  onSwipeAction?: () => void;
  disabled?: boolean;
  itemIndex?: number;
  item?: T;
  className?: string;
};
