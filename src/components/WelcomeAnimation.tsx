import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const WelcomeAnimation: React.FC = () => {
  const [show, setShow] = useState(() => {
    // Check if we've already shown the animation in this session
    const hasShown = sessionStorage.getItem('welcomeAnimationShown_v3');
    if (!hasShown) {
      sessionStorage.setItem('welcomeAnimationShown_v3', 'true');
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setShow(false);
      }, 5500); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F1113]"
        >
          <motion.div 
            className="flex flex-col items-center"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 1.5 }}
              className="text-2xl font-black tracking-tighter text-white uppercase mb-4"
            >
              MCKL<span className="text-red-500">SPORTS</span>
            </motion.h2>
            
            <motion.img 
              src="https://i.imgur.com/U9s8qfx_d.webp?maxwidth=760&fidelity=grand" 
              alt="MCKL SPORTS Logo" 
              className="h-40 object-contain"
              referrerPolicy="no-referrer"
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 80,
                damping: 20,
                delay: 0.4
              }}
            />
            
            <motion.div 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "100%" }}
              transition={{ delay: 1.5, duration: 1.5 }}
              className="h-0.5 bg-red-500 mt-8 rounded"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2, duration: 1 }}
              className="mt-4 text-[12px] uppercase tracking-[0.3em] text-gray-400 font-bold"
            >
              Welcome to Carnival 2026
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
