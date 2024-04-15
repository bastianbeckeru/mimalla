"use client";

import { motion } from "framer-motion";

export const MotionOl = motion.ol;
export const MotionLi = motion.li;

export type VariantProps = {
  hidden: { opacity: number };
  visible: {
    opacity: number;
    transition?: {
      staggerChildren: number;
    };
  };
};
