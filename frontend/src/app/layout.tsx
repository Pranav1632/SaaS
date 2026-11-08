import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SaansAI — Hyperlocal Air Exposure Intelligence (Pune / PCCOE)",
  description: "Personal Air-Quality Exposure, Source-Aware Attribution & T-20 Departure Sentinel for PCCOE & Pune Region",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="antialiased min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
        {children}
      </body>
    </html>
  );
}
