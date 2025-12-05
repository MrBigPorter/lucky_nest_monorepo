"use client";
import { ModalFixed } from "./ModalFixed.tsx";
import type { ModalProps } from "./Types.ts";
import ReactDOM from "react-dom/client";

export const ModalManager = {
  open: (props: Omit<ModalProps, 'onFinishClose'>) => {
    const container = document.createElement("div");
    container.classList.add("modal-container");
    document.body.appendChild(container);
    const root = ReactDOM.createRoot(container);

    const destroy = () => {
      root.unmount();
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };

    const handleFinishClose = () => {
      destroy();
    };

    root.render(<ModalFixed {...props} onFinishClose={handleFinishClose} />);

    return {
      close: destroy,
    };
  },
};
