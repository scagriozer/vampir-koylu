import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Vampir Köylü · Masa Oyunu",
    template: "%s · Vampir Köylü",
  },
  description:
    "Tek cihazla, masa etrafında oynanan Vampir Köylü. 4–12 kişi için gizli rol dağıtımı, gece görevleri, tartışma sayacı ve oylama — anlatıcıya gerek yok.",
  applicationName: "Vampir Köylü",
  appleWebApp: {
    capable: true,
    title: "Vampir Köylü",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1020",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // Ana ekrana eklenip tam ekran açıldığında içerik çentiğin/ada'nın altına
  // kadar uzansın; güvenli alan boşlukları CSS tarafında env() ile veriliyor.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
