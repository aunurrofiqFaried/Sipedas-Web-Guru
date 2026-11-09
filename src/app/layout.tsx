import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const googleSans = localFont({
  src: [
    { path: "../fonts/montserrat_regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/montserrat_medium.ttf", weight: "500", style: "normal" },
    { path: "../fonts/montserrat_semibold.ttf", weight: "600", style: "normal" },
    { path: "../fonts/montserrat_bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-google-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sipedas Guru",
  description: "Absensi, jurnal, dan poin siswa",
};

// viewportFit "cover" supaya konten memahami area aman di iPhone (poni dan garis bawah)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={googleSans.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}