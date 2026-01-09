"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"
import { motionConfig } from "./config"

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

/**
 * Page transition wrapper - applies fade + subtle slide up animation
 * Use this in layout.tsx to wrap page content
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        duration: motionConfig.duration.normal,
        ease: motionConfig.ease.default,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
