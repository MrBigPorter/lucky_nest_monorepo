import { useCallback } from 'react';
import copy from 'copy-to-clipboard';
import { useToastStore } from '@/store/useToastStore';

export const useCopyToClipboard = () => {
  const addToast = useToastStore((state) => state.addToast);

  const copyToClipboard = useCallback(
    (text: string | number | undefined | null, label: string = 'Content') => {
      if (!text) {
        return;
      }

      const textToCopy = String(text);

      const isSuccess = copy(textToCopy);

      if (isSuccess) {
        addToast('success', `${label} copied to clipboard`);
      } else {
        addToast('error', 'Failed to copy');
      }
    },
    [addToast],
  );

  return { copy: copyToClipboard };
};
