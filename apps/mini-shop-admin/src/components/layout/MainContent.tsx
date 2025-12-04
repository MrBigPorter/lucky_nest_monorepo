import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const MainContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();

  return (
    <main className="flex-1 overflow-auto p-4 lg:p-6 custom-scrollbar">
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
};
