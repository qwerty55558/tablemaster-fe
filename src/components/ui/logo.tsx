import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "icon" | "full"
}

const sizeMap = {
  sm: { icon: 16, full: { width: 100, height: 24 } },
  md: { icon: 24, full: { width: 140, height: 32 } },
  lg: { icon: 32, full: { width: 180, height: 40 } },
  xl: { icon: 48, full: { width: 220, height: 48 } },
}

export function Logo({ className, size = "md", variant = "icon" }: LogoProps) {
  const dimensions = sizeMap[size]

  if (variant === "full") {
    return (
      <Image
        src="/icons/logo-text.svg"
        alt="TableMaster"
        width={dimensions.full.width}
        height={dimensions.full.height}
        className={cn("dark:invert", className)}
        priority
      />
    )
  }

  return (
    <Image
      src="/icons/logo.svg"
      alt="TableMaster"
      width={dimensions.icon}
      height={dimensions.icon}
      className={cn("dark:invert", className)}
      priority
    />
  )
}

interface LogoIconProps {
  className?: string
}

export function LogoIcon({ className }: LogoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      className={cn("size-6", className)}
    >
      {/* Tablet/Table device */}
      <rect
        x="6"
        y="4"
        width="36"
        height="40"
        rx="4"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />

      {/* Screen area */}
      <rect
        x="10"
        y="8"
        width="28"
        height="28"
        rx="2"
        fill="currentColor"
        opacity="0.15"
      />

      {/* Check mark */}
      <path
        d="M16 22L22 28L32 16"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Home button / indicator */}
      <circle cx="24" cy="40" r="2" fill="currentColor" />
    </svg>
  )
}
