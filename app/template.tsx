"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Route transition. `template.tsx` re-mounts on every navigation, so this runs
 * once per page instead of on every re-render. Kept to opacity + 8px of travel:
 * enough to feel like a change of place, short enough that it never delays the
 * reader.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
