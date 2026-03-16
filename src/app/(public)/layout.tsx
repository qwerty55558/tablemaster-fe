import React from "react"

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="select-none">
      {children}
    </div>
  )
}
