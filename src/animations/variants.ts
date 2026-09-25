import type { Variants, Transition } from 'motion/react';

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 28,
};

export const gentleSpring: Transition = {
  type: 'spring',
  stiffness: 220,
  damping: 24,
};

export const appleEase: Transition = {
  duration: 0.35,
  ease: [0.16, 1, 0.3, 1],
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: appleEase },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: springTransition },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

export const scaleUpVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: springTransition },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.18 } },
};
