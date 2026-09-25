import type { Transition } from 'motion/react';

export const pageTransition: Transition = {
  duration: 0.28,
  ease: [0.25, 0.1, 0.25, 1],
};

export const tabSwitchTransition: Transition = {
  type: 'spring',
  stiffness: 450,
  damping: 35,
};

export const drawerTransition: Transition = {
  type: 'spring',
  damping: 30,
  stiffness: 300,
};
