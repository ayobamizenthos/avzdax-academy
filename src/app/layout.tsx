import type { Metadata } from "next";
import { Cinzel, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Avzdax Academy",
  description: "Identify the Elite.",
  icons: {
    icon: "/avzdax-logoX.png",
    apple: "/avzdax-logoX.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#000000] text-[#FFFFFF]">
      <body
        className={`${outfit.variable} ${cinzel.variable} ${jetbrainsMono.variable} antialiased min-h-screen selection:bg-white/20`}
      >
        {children}
      </body>
    </html>
  );
}
