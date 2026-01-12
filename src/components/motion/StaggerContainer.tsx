"use client"

import { motion, Variants, useReducedMotion } from "framer-motion"
import { ReactNode, useState, useEffect } from "react"
import { motionConfig } from "./config"

interface StaggerContainerProps {
  children: ReactNode
  className?: string
  /** Delay between each child animation */
  staggerDelay?: number
  /** Initial delay before animation starts */
  delayChildren?: number
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
  /** Custom animation variant - defaults to fadeInUp */
  variant?: "fadeIn" | "fadeInUp" | "fadeInDown" | "scaleIn"
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: motionConfig.stagger.normal,
      delayChildren: 0,
    },
  },
}

const itemVariants: Record<string, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: motionConfig.duration.normal, ease: motionConfig.ease.default }
    },
  },
  fadeInUp: {
    hidden: { opacity: 0, y: 12 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: motionConfig.duration.normal, ease: motionConfig.ease.default }
    },
  },
  fadeInDown: {
    hidden: { opacity: 0, y: -12 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: motionConfig.duration.normal, ease: motionConfig.ease.default }
    },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: motionConfig.duration.normal, ease: motionConfig.ease.default }
    },
  },
}

/**
 * Container for staggered animations - children will animate in sequence
 * Use with StaggerItem for each child element
 */
export function StaggerContainer({
  children,
  className,
  staggerDelay = motionConfig.stagger.normal,
  delayChildren = 0,
}: StaggerContainerProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren,
          },
        },
      }}
      initial={isMounted ? "hidden" : false}
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Individual item within a StaggerContainer
 * Automatically inherits animation timing from parent
 */
export function StaggerItem({
  children,
  className,
  variant = "fadeInUp",
}: StaggerItemProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // SSR에서는 애니메이션 없이 바로 보여줌
  if (!isMounted) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      variants={itemVariants[variant]}
      className={className}
    >
      {children}
    </motion.div>
  )
}
