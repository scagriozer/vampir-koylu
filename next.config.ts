import type { NextConfig } from "next";

// GitHub Pages alt yolda yayınlanır (ör. /vampir-koylu). Yol, yayın iş akışında
// PAGES_BASE_PATH ile veriliyor; boş bırakılırsa uygulama kök dizinde çalışır,
// böylece yerel geliştirme ve başka bir sunucuya dağıtım etkilenmez.
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Oyun tamamen tarayıcıda çalışıyor; sunucuya ihtiyaç yok, statik dosya olarak
  // dışa aktarılabiliyor.
  output: "export",
  basePath,
  images: { unoptimized: true },
  // Statik sunucularda /yol → /yol/index.html eşleşmesi için.
  trailingSlash: true,
};

export default nextConfig;
