"use client";

import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useLanguage, LANGUAGES } from "@/lib/language-contex";
import { useTheme } from "./theme-provider";

export function LanguageToggle() {

  const { language, setLanguageByCode } = useLanguage();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isDark = theme === "dark";

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Select language"
        title={`Language: ${language.label}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          height: "34px",
          padding: "0 10px",
          borderRadius: "10px",
          border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #E2DFD8",
          background: isDark ? "rgba(255,255,255,0.06)" : "transparent",
          color: isDark ? "#A8A8C0" : "#4A4A68",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 500,
          transition: "all 0.2s",
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "#F0EEE9";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "transparent";
        }}
      >
        <Globe size={14} />
        <span>{language.flag}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            background: isDark ? "#1A1A2E" : "#FFFFFF",
            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #E2DFD8",
            borderRadius: "12px",
            boxShadow: isDark
              ? "0 8px 32px rgba(0,0,0,0.5)"
              : "0 8px 32px rgba(0,0,0,0.12)",
            padding: "6px",
            zIndex: 100,
            minWidth: "170px",
            maxHeight: "320px",
            overflowY: "auto",
          }}
        >
          {LANGUAGES.map(lang => {
            const isSelected = lang.code === language.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguageByCode(lang.code);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "8px",
                  border: "none",
                  background: isSelected
                    ? (isDark ? "rgba(0,137,123,0.2)" : "rgba(0,137,123,0.08)")
                    : "transparent",
                  color: isSelected
                    ? "#00897B"
                    : (isDark ? "#C8C8E0" : "#4A4A68"),
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: isSelected ? 600 : 400,
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => {
                  if (!isSelected)
                    e.currentTarget.style.background = isDark
                      ? "rgba(255,255,255,0.06)"
                      : "#F5F3EF";
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ fontSize: "16px" }}>{lang.flag}</span>
                <span>{lang.nativeLabel}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
