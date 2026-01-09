"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"
import { motionConfig } from "./config"

interface PageTransitionWrapperProps {
  children: ReactNode
  className?: string
}

/**
 * Client-side wrapper for page transitions
 * Use this in server component layouts to wrap children
 */
export function PageTransitionWrapper({ children, className }: PageTransitionWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
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
