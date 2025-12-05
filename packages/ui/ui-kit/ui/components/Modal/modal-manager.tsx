"use client";
import { ModalFixed } from "./ModalFixed";
import type { ModalProps } from "./Types";
import ReactDOM from "react-dom/client";

/**
 * ModalManager is a utility for managing modal instances.
 * It provides a method to open a modal with specified properties
 * and handles the cleanup when the modal is closed.
 * * @example
 * ```ts
 * import { ModalManager } from '@ui-kit';
 * ModalManager.open({
 *   title: 'Confirm Action',
 *   content: 'Are you sure you want to proceed?',
 *   confirmText: 'Yes',
 *   cancelText: 'No',
 *   onCancel: () => console.log('Cancelled'),
 *   onConfirm: () => console.log('Confirmed'),
 *   renderChildren: <div>Custom content can go here</div>,
 *   onFinishClose: () => console.log('Modal closed'),
 *   showClose: true,
 *   onFinishClose: () => console.log('Modal closed'),
 *
 *    // });
 *    // });
 *    // });
 *    * ```
 *
 */
export const ModalManager = {
  open: (props: ModalProps) => {
    const container = document.createElement("div");
    container.classList.add("modal-container");
    document.body.appendChild(container);
    const root = ReactDOM.createRoot(container);

    const destroy = () => {
      root.unmount();
      document.body.removeChild(container);
    };

    const handleFinishClose = () => {
      destroy();
      props.onFinishClose?.();
    };

    root.render(<ModalFixed {...props} onFinishClose={handleFinishClose} />);

    return {
      close: destroy,
    };
  },
};
