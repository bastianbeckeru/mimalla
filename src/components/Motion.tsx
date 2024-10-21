"use client";

import { motion } from "framer-motion";

export const MotionOl = motion.ol;
export const MotionLi = motion.li;
export const MotionDiv = motion.div;

export type VariantProps = {
  hidden: { opacity: number };
  visible: {
    opacity: number;
    transition?: {
      staggerChildren: number;
    };
  };
};
