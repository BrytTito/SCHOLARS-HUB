"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion, type Variants } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Blur-fade reveal.
 *
 * Adapted from Magic UI's `BlurFade` (magicuidesign/magicui, MIT licensed),
 * trimmed to what this app uses and extended with `useReducedMotion`: when the
 * visitor asks their OS for reduced motion the element simply appears.
 *
 * https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/blur-fade.tsx
 */
export type BlurFadeProps = {
  children: React.ReactNode;
  className?: string;
  /** Seconds to wait before starting. Use it to stagger a list. */
  delay?: number;
  duration?: number;
  /** Travel distance in pixels. */
  offset?: number;
  direction?: "up" | "down" | "left" | "right";
  blur?: string;
  /** Only animate the first time the element scrolls into view. */
  inView?: boolean;
};

export function BlurFade({
  children,
  className,
  delay = 0,
  duration = 0.4,
  offset = 8,
  direction = "up",
  blur = "6px",
  inView = false,
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const show = !inView || seen;

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const axis = direction === "left" || direction === "right" ? "x" : "y";
  const sign = direction === "down" || direction === "right" ? -1 : 1;

  const variants: Variants = {
    hidden: { [axis]: sign * offset, opacity: 0, filter: `blur(${blur})` },
    visible: { [axis]: 0, opacity: 1, filter: "blur(0px)" },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={show ? "visible" : "hidden"}
      variants={variants}
      transition={{ delay, duration, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
