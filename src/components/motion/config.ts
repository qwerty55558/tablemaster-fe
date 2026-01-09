// Global motion configuration for consistent animations
export const motionConfig = {
  // Duration presets
  duration: {
    fast: 0.15,
    normal: 0.2,
    slow: 0.3,
  },
  
  // Easing presets
  ease: {
    default: [0.4, 0, 0.2, 1] as const, // Material Design standard easing
    easeOut: "easeOut" as const,
    easeInOut: "easeInOut" as const,
    spring: { type: "spring", stiffness: 300, damping: 30 } as const,
  },
  
  // Stagger presets
  stagger: {
    fast: 0.03,
    normal: 0.05,
    slow: 0.08,
  },
  
  // Common animation variants
  variants: {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    fadeInUp: {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 },
    },
    fadeInDown: {
      hidden: { opacity: 0, y: -10 },
      visible: { opacity: 1, y: 0 },
    },
    scaleIn: {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1 },
    },
  },
} as const
