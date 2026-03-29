"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"

export function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "34px",
        height: "34px",
        borderRadius: "10px",
        border: theme === "dark" ? "1px solid rgba(255,255,255,0.12)" : "1px solid #E2DFD8",
        background: theme === "dark" ? "rgba(255,255,255,0.06)" : "transparent",
        color: theme === "dark" ? "#A8A8C0" : "#4A4A68",
        cursor: "pointer",
        transition: "all 0.2s",
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = theme === "dark" ? "rgba(255,255,255,0.1)" : "#F0EEE9"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = theme === "dark" ? "rgba(255,255,255,0.06)" : "transparent"
      }}
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
