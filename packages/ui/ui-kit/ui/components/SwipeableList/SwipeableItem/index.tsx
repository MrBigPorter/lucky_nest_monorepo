"use client";

import {
  animate,
  motion,
  MotionValue,
  useDragControls,
  useMotionValue,
} from "framer-motion";
import { cn } from "@utils";
import { SwipeableItemProps, SwipeAction } from "./Types";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

/**
 * Keep track of the currently open item to prevent closing when dragging
 */
let currentOpenItem: MotionValue<number> | null = null;

/**
 * SwipeableItem component
 * @param children - The content to be swiped
 * @param actions - An array of actions to display on the right side of the item
 * @param onSwipeAction - Callback function to be called when the item is swiped
 * @param threshold - The threshold for triggering the swipe action
 * @param disabled - Whether the item is disabled
 * @param itemIndex - The index of the item
 * @param item - The item data
 * @constructor
 * @returns
 * @example
 * <SwipeableItem
 *   children={<div>Item content</div>}
 *   actions={[
 *     { label: 'Delete', onClick: () => console.log('Delete clicked') },
 *     { label: 'Edit', onClick: () => console.log('Edit clicked') },
 *   ]}
 *   onSwipeAction={() => console.log('Item swiped')}
 *   threshold={80}
 *   disabled={false}
 *   itemIndex={0}
 *   item={{ id: 1, name: 'Item 1' }}
 *  >
 *  </SwipeableItem>
 */
export function SwipeableItem<T>({
  children,
  actions,
  onSwipeAction,
  threshold,
  disabled = false,
  itemIndex,
  item,
}: Readonly<SwipeableItemProps<T>>) {
  /**
   * Use DragControls to control the drag behavior of the item
   */
  const dragControls = useDragControls();
  /**
   * Use MotionValue to track the x position of the item
   */
  const x = useMotionValue(0);
  const [buttonWidth, setButtonWidth] = useState(0);
  const buttonRef = React.useRef<HTMLDivElement>(null);
  /**
   * Animate the item to a specific position
   * @param x - The MotionValue representing the x position of the item
   * @param value - The target value to animate to
   * @returns {void}
   */
  const animateTo = useCallback((x: MotionValue<number>, value: number) => {
    if (value !== 0 && currentOpenItem && currentOpenItem !== x) {
      animate(currentOpenItem, 0, {
        type: "spring",
        stiffness: 400,
        damping: 40,
        mass: 0.8,
        restDelta: 0.001,
      });
      currentOpenItem = null;
    }

    if (value !== 0) {
      currentOpenItem = x;
    } else if (currentOpenItem === x) {
      currentOpenItem = null;
    }

    animate(x, value, {
      type: "spring",
      stiffness: 400,
      damping: 40,
      mass: 0.8,
      restDelta: 0.001,
    });
  }, []);

  /**
   * Handle drag end event
   * @param _ - The event object
   * @param info - The drag info object
   * @returns {void}
   */
  const handleDragEnd = useCallback(
    (_: never, info: { velocity: { x: number } }) => {
      const velocity = info.velocity.x;
      const isFlick = Math.abs(velocity) > 500;
      const currentX = x.get();

      const shouldSwipeToEnd = isFlick
        ? velocity < 0
        : currentX <= -buttonWidth / 2;

      if (shouldSwipeToEnd) {
        onSwipeAction?.();
        animateTo(x, -buttonWidth);
      } else {
        animateTo(x, 0);
      }
    },
    [animateTo, buttonWidth, onSwipeAction, x],
  );

  const handleContentClick = useCallback(() => {
    animateTo(x, 0);
  }, [animateTo, x]);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        animateTo(x, 0);
      }
    },
    [animateTo, x],
  );

  /**
   * Add event listener to handle click outside
   * @returns {void}
   */
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  /**
   * Handle drag event
   * @param event - The event object
   * @param info - The drag info object
   * @returns {void}
   */
  const handleDrag = useCallback(
    (event: never, info: { offset: { x: number } }) => {
      if (currentOpenItem && currentOpenItem !== x && info.offset.x !== 0) {
        // Prevent dragging when another item is open
        animate(currentOpenItem, 0, {
          type: "spring",
          stiffness: 400,
          damping: 40,
          mass: 0.8,
          restDelta: 0.001,
        });
        currentOpenItem = null;
      }
    },
    [x],
  );

  const handleCancel = useCallback(() => {
    // Close the current open item
    if (currentOpenItem) {
      animate(currentOpenItem, 0, {
        type: "spring",
        stiffness: 400,
        damping: 40,
        mass: 0.8,
        restDelta: 0.001,
      });
    }
  }, []);

  const handleButtonClick = useCallback(
    (action: Pick<SwipeAction<T>, "onClick">, index: number) => {
      if (item !== undefined) {
        action?.onClick?.({ ...item, index });
      }
      handleCancel();
    },
    [handleCancel, item],
  );
  // Calculate the width of the buttons based on the threshold and number of actions
  useLayoutEffect(() => {
    if (buttonRef.current) {
      const width = buttonRef.current.getBoundingClientRect().width;
      setButtonWidth(width);
      const buttonsWidth = width * actions.length;
      if (width > 0) {
        setButtonWidth(width);
      } else {
        setButtonWidth(buttonsWidth);
      }
    }
  }, [actions.length, threshold]);

  return (
    <motion.div
      className="relative w-full overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        whileTap={{ scale: 0.98 }}
        drag={disabled ? false : "x"}
        dragConstraints={{ left: -buttonWidth, right: 0 }}
        dragElastic={0.2}
        dragControls={dragControls}
        style={{
          x,
          minWidth: "100%",
          userSelect: "none",
          WebkitUserSelect: "none",
          willChange: "transform",
          backfaceVisibility: "hidden",
        }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className={`flex items-center justify-between`}
      >
        <button
          type="button"
          className="w-full flex flex-shrink-0 items-center"
          onClick={handleContentClick}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {children}
        </button>

        <div className="flex items-stretch" ref={buttonRef}>
          {actions.map((action, index) => (
            <button
              aria-label={action.label}
              tabIndex={0}
              key={`${action.label}-${index}`}
              onClick={() => handleButtonClick(action, itemIndex || 0)}
              type="button"
              className={cn(
                "w-[80rem] text-white font-medium text-[20rem] flex-shrink-0 flex items-center justify-center",
                index === 0 ? "bg-red-500" : "bg-gray-400",
                action.className,
              )}
            >
              {action.icons}
              {action.label}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
