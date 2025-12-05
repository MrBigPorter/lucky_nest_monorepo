import { AnimatePresence } from "framer-motion";
import { SwipeableItem } from "./SwipeableItem";
import React from "react";
import { SwipeAction } from "./SwipeableItem/Types";
import { cn } from "@utils";

type WithKey<T> = T & { key: string };
interface SwipeableListProps<T> {
  items: WithKey<T>[];
  renderItem: (item: T) => React.ReactNode;
  actions: SwipeAction<T>[];
  threshold?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * SwipeableList component
 * @param items - Array of items to render with unique keys
 * @param renderItem - Function to render each item
 * @param actions - Array of actions to display on swipe
 * @param threshold  - Threshold for triggering swipe actions (default: 80) the total width of the buttons - REM
 * @param disabled - Optional boolean to disable swipe actions (default: false)
 * @param className - Optional className for custom styling
 * @constructor
 */
export function SwipeableList<T>({
  items,
  renderItem,
  actions,
  threshold = 80,
  disabled,
  className,
}: Readonly<SwipeableListProps<T>>) {
  return (
    <AnimatePresence>
      <div className={cn("w-full flex flex-col", className)}>
        {items.map((item, index) => (
          <SwipeableItem
            key={item.key + index}
            disabled={disabled}
            itemIndex={index}
            actions={actions}
            threshold={threshold}
            item={item}
            className={className}
          >
            {renderItem(item)}
          </SwipeableItem>
        ))}
      </div>
    </AnimatePresence>
  );
}
