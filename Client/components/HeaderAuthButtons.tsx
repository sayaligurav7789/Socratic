"use client"

import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { useLanguage } from "@/lib/i18n"

export default function HeaderAuthButtons() {
  const { t } = useLanguage()
  return (
    <>
      <SignInButton>
        <button
          className="dark-aware-btn-outline"
          style={{
            fontFamily: "var(--font-ui, 'DM Sans', sans-serif)",
            fontSize: "13px",
            fontWeight: 500,
            borderRadius: "10px",
            padding: "6px 14px",
            cursor: "pointer",
            border: "1px solid #E2DFD8",
            color: "#4A4A68",
            background: "transparent",
          }}
        >
          {t("header.signIn")}
        </button>
      </SignInButton>
      <SignUpButton>
        <button
          style={{
            fontFamily: "var(--font-ui, 'DM Sans', sans-serif)",
            fontSize: "13px",
            fontWeight: 600,
            color: "#fff",
            background: "linear-gradient(135deg, #00897B 0%, #00695C 100%)",
            border: "none",
            borderRadius: "10px",
            padding: "6px 14px",
            cursor: "pointer",
          }}
        >
          {t("header.signUp")}
        </button>
      </SignUpButton>
    </>
  )
}
