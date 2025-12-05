"use client";
import React, { JSX } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@utils";
import { ModalProps } from "./Types";

/**
 * ModalFixed is a fixed-position modal component that displays content
 * with optional title, confirmation, and cancellation buttons.
 * It uses Framer Motion for animations and supports custom rendering of children.
 * @param title - The title of the modal, displayed at the top.
 * @param content - The main content of the modal, displayed below the title.
 * @param confirmText - The text for the confirmation button.
 * @param cancelText - The text for the cancellation button.
 * @param onCancel - Callback function when the cancel button is clicked.
 * @param onConfirm - Callback function when the confirm button is clicked.
 * @param renderChildren - Optional custom rendering function for children content.
 * @param onFinishClose - Callback function when the modal finishes closing.
 * @param showClose - Whether to show the close button (default is true).
 * @param className - Optional className to apply custom styles to the modal dialog.
 * @constructor
 * @example
 * <ModalFixed
 * title="Confirm Action"
 * content="Are you sure you want to proceed?"
 * confirmText="Yes"
 * cancelText="No"
 * onCancel={() => console.log('Cancelled')}
 * onConfirm={() => console.log('Confirmed')}
 * renderChildren={<CustomComponent />}
 * onFinishClose={() => console.log('Modal closed')}
 * showClose={true}
 * className="custom-modal"
 * />
 * @returns {JSX.Element} The rendered modal component.
 * @see {@link ModalProps} for the props interface.
 */

export function ModalFixed({
  title,
  content,
  confirmText,
  cancelText,
  onCancel,
  onConfirm,
  renderChildren,
  onFinishClose,
  showClose = true,
  className,
}: Readonly<ModalProps>): JSX.Element {
  const [visible, setVisible] = React.useState<boolean>(true);

  const handleClose = React.useCallback(() => setVisible(false), []);

  const handleModalClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const confirm = React.useCallback(() => {
    onConfirm?.();
    handleClose();
  }, [onConfirm, handleClose]);

  const cancel = React.useCallback(() => {
    onCancel?.();
    handleClose();
  }, [onCancel, handleClose]);

  const modalVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  const contentVariants = {
    initial: { y: -20 },
    animate: { y: 0 },
    exit: { y: -20 },
  };

  const buttonVariants = {
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
  };

  const closeButtonVariants = {
    hover: { scale: 1.1 },
    tap: { scale: 0.9 },
  };

  return (
    <AnimatePresence onExitComplete={onFinishClose}>
      {visible && (
        <motion.div
          variants={modalVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full h-screen fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center"
          onClick={handleClose}
        >
          <motion.div
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className={cn(
              "w-[350rem] min-h-[150rem] bg-white pb-[20rem] rounded-[10rem] shadow-lg relative flex flex-col items-center",
              className,
            )}
            onClick={handleModalClick}
          >
            {title && (
              <h2 className="w-full py-[10rem] text-[20rem] font-bold flex justify-center">
                {title}
              </h2>
            )}

            {renderChildren || (
              <div className="w-full px-[15rem]">{content}</div>
            )}

            <div
              className={cn(
                "w-full flex justify-center gap-[10rem]",
                confirmText && cancelText && "px-[15rem]",
              )}
            >
              {cancelText && (
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="w-[90%] mt-[20rem] h-[50rem] bg-gray-300 text-black text-[20rem] rounded-[8rem] flex items-center justify-center"
                  onClick={cancel}
                >
                  {cancelText}
                </motion.button>
              )}
              {confirmText && (
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="w-[90%] mt-[20rem] h-[50rem] bg-blue-400 text-white text-[20rem] rounded-[8rem] flex items-center justify-center"
                  onClick={confirm}
                >
                  {confirmText}
                </motion.button>
              )}
            </div>

            {showClose && (
              <motion.button
                variants={closeButtonVariants}
                whileHover="hover"
                whileTap="tap"
                className="absolute top-[15rem] right-[15rem] p-2 rounded-full hover:bg-gray-100 transition-colors"
                onClick={handleClose}
              >
                <X className="w-[20rem] h-[20rem]" />
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
