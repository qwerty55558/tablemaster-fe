"use client"

import { motion, Variants } from "framer-motion"
import { ReactNode } from "react"
import { motionConfig } from "./config"

interface FadeInProps {
  children: ReactNode
  className?: string
  /** Animation direction */
  direction?: "up" | "down" | "left" | "right" | "none"
  /** Animation delay in seconds */
  delay?: number
  /** Animation duration override */
  duration?: number
  /** Whether to animate only once when in view */
  once?: boolean
}

const directionOffset = {
  up: { y: 16 },
  down: { y: -16 },
  left: { x: 16 },
  right: { x: -16 },
  none: {},
}

/**
 * Simple fade-in wrapper with optional direction
 * Great for individual elements that need subtle entrance animation
 */
export function FadeIn({ 
  children, 
  className,
  direction = "up",
  delay = 0,
  duration = motionConfig.duration.normal,
  once = true,
}: FadeInProps) {
  const offset = directionOffset[direction]
  
  const variants: Variants = {
    hidden: { 
      opacity: 0, 
      ...offset,
    },
    visible: { 
      opacity: 1, 
      x: 0,
      y: 0,
      transition: { 
        duration,
        delay,
        ease: motionConfig.ease.default,
      },
    },
  }

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
