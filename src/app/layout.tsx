import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Header } from "@/components/layout";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cooking Mate | Mediterranean Recipe Planning",
  description:
    "Your personal cooking companion. Browse Mediterranean recipes, plan meals, and organize shopping lists.",
  keywords: [
    "mediterranean diet",
    "meal planning",
    "recipes",
    "healthy eating",
    "shopping list",
    "cooking",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
