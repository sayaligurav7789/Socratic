import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, UserButton, Show } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Socratic — Teach it. Prove it. Own it.",
  description: "Prove your knowledge by teaching Mia, an AI student who finds your blind spots.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${dmSans.variable} ${fraunces.variable} h-full antialiased`}
      >
        <body
          className="min-h-full flex flex-col"
          style={{ fontFamily: "var(--font-ui, 'DM Sans', sans-serif)" }}
        >
          <ThemeProvider>
            <header
              className="fixed top-0 right-0 z-50 flex items-center gap-2 px-5 py-3.5"
            >
              <ThemeToggle />
              <Show when="signed-out">
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
                    Sign in
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
                    Sign up
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </header>

            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
