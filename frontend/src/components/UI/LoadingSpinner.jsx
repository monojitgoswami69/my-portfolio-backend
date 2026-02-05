import React from 'react';
import { motion } from 'framer-motion';

export function LoadingSpinner({ text = 'Loading...', fullScreen = false }) {
  const containerClass = fullScreen 
    ? "fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50"
    : "flex items-center justify-center w-full h-full min-h-[300px]";

  return (
    <div className={containerClass}>
      <motion.div 
        className="flex flex-col items-center justify-center gap-4 p-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Modern 3-dot loading animation */}
        <div className="flex gap-2">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-3 h-3 bg-primary-600 rounded-full"
              animate={{
                y: ["0%", "-50%", "0%"],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: index * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        
        {/* Loading text with fade animation */}
        <motion.p 
          className="text-neutral-600 font-medium text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {text}
        </motion.p>
      </motion.div>
    </div>
  );
}
