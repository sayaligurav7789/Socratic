"use client"

import { useEffect, useRef, useState } from "react"
import { Globe, Check, ChevronDown } from "lucide-react"
import { LANGUAGES, useLanguage, type LanguageCode } from "@/lib/i18n"

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0]

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        aria-label="Change language"
        className="flex items-center gap-1.5 rounded-[10px] border border-[#E2DFD8] dark:border-white/10 px-2.5 py-[6px] text-[12.5px] font-medium text-[#4A4A68] dark:text-[#9898BB] bg-white/40 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-colors"
        style={{ fontFamily: "var(--font-ui, 'DM Sans', sans-serif)" }}
      >
        <Globe size={13} />
        <span className="hidden sm:inline">{current.native}</span>
        <span className="sm:hidden uppercase">{current.code}</span>
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+6px)] z-[60] w-44 max-h-72 overflow-y-auto rounded-xl border border-[#E2DFD8] dark:border-white/10 bg-white dark:bg-[#13131F] shadow-xl py-1"
          style={{ fontFamily: "var(--font-ui, 'DM Sans', sans-serif)" }}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLanguage(l.code as LanguageCode)
                setOpen(false)
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] text-[#1A1A2E] dark:text-[#DDDDEF] hover:bg-[#F5F3EE] dark:hover:bg-white/5"
            >
              <span>{l.native}</span>
              {l.code === language && <Check size={13} className="text-[#00897B]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
