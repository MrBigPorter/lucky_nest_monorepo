import { AnimatePresence } from "framer-motion";
import { SwipeableItem } from "@/components";
import React from "react";
import { SwipeAction } from "./SwipeableItem/Types.ts";
import { cn } from "@/lib/utils";

type WithKey<T> = T & { key: string };
interface SwipeableListProps<T> {
  items: WithKey<T>[];
  renderItem: (item: T) => React.ReactNode;
  actions: SwipeAction<T>[];
  disabled?: boolean;
  className?: string;
}

export function SwipeableList<T>({
  items,
  renderItem,
  actions,
  disabled,
  className,
}: Readonly<SwipeableListProps<T>>) {
  return (
    <div className={cn("w-full flex flex-col", className)}>
      <AnimatePresence>
        {items.map((item) => (
          <SwipeableItem
            key={item.key}
            disabled={disabled}
            actions={actions}
            item={item}
          >
            {renderItem(item)}
          </SwipeableItem>
        ))}
      </AnimatePresence>
    </div>
  );
}
