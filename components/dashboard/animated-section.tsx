"use client";

import type { HTMLAttributes } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const fade = {
  hide: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 }
};

type AnimatedSectionProps = HTMLAttributes<HTMLElement> & {
  delay?: number;
};

export function AnimatedSection({ children, className, delay = 0, ...props }: AnimatedSectionProps) {
  return (
    <motion.section
      variants={fade}
      initial="hide"
      animate="show"
      transition={{ duration: 0.5, delay }}
      className={cn("h-full", className)}
      {...props}
    >
      {children}
    </motion.section>
  );
}
