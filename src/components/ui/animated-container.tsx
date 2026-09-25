import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import {
  fadeInVariants,
  slideUpVariants,
  staggerContainerVariants,
  scaleUpVariants,
} from '@/animations/variants';

export const FadeIn: React.FC<HTMLMotionProps<'div'>> = ({ children, ...props }) => (
  <motion.div variants={fadeInVariants} initial="hidden" animate="visible" exit="exit" {...props}>
    {children}
  </motion.div>
);

export const SlideUp: React.FC<HTMLMotionProps<'div'>> = ({ children, ...props }) => (
  <motion.div variants={slideUpVariants} initial="hidden" animate="visible" exit="exit" {...props}>
    {children}
  </motion.div>
);

export const StaggerContainer: React.FC<HTMLMotionProps<'div'>> = ({ children, ...props }) => (
  <motion.div
    variants={staggerContainerVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    {...props}
  >
    {children}
  </motion.div>
);

export const ScaleOnHover: React.FC<HTMLMotionProps<'div'>> = ({ children, ...props }) => (
  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} {...props}>
    {children}
  </motion.div>
);

export const ScaleUp: React.FC<HTMLMotionProps<'div'>> = ({ children, ...props }) => (
  <motion.div variants={scaleUpVariants} initial="hidden" animate="visible" exit="exit" {...props}>
    {children}
  </motion.div>
);
