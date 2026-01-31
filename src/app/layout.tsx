import type { Metadata } from "next";
import { Lora, Cinzel_Decorative, Orbitron, VT323 } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import { ThemeBackground } from "@/components/ThemeBackground";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-vt323",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-cinzel-decorative",
  display: "swap",
});

async function getSettings() {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: ["siteName", "theme"] } },
    });
    const map: Record<string, string> = {};
    rows.forEach((r) => (map[r.key] = r.value));
    return {
      siteName: map.siteName || "Maggie's Book Club",
      theme: map.theme || "classic",
    };
  } catch {
    return { siteName: "Maggie's Book Club", theme: "classic" };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSettings();
  return {
    title: siteName,
    description: "A book club for friends to track and rate books together",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();

  return (
    <html lang="en" data-theme={settings.theme} className={`${lora.variable} ${cinzelDecorative.variable} ${orbitron.variable} ${vt323.variable}`}>
      <body
        className="font-serif antialiased bg-cream"
      >
        <SessionProvider>
          <SiteSettingsProvider initialSettings={settings}>
            <ThemeBackground />
            {children}
          </SiteSettingsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
