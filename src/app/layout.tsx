import type { Metadata } from "next";
import { Lora, Cinzel_Decorative } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-cinzel-decorative",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maggie's Book Club",
  description: "A book club for friends to track and rate books together",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${lora.variable} ${cinzelDecorative.variable} font-serif antialiased bg-cream`}
      >
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
