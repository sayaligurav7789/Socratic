import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, UserButton, Show } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageProvider } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import HeaderAuthButtons from "@/components/HeaderAuthButtons";
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
          <LanguageProvider>
            <ThemeProvider>
              <header
                className="fixed top-0 right-0 z-50 flex items-center gap-2 px-5 py-3.5"
              >
                <LanguageSwitcher />
                <ThemeToggle />
                <Show when="signed-out">
                  <HeaderAuthButtons />
                </Show>
                <Show when="signed-in">
                  <UserButton />
                </Show>
              </header>

              {children}
            </ThemeProvider>
          </LanguageProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
