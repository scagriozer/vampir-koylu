import type { MetadataRoute } from "next";

// Statik export'ta metadata rotalarının derleme anında üretilmesi gerekiyor.
export const dynamic = "force-static";

/** Telefonda "ana ekrana ekle" ile tam ekran açılabilsin diye. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vampir Köylü · Masa Oyunu",
    short_name: "Vampir Köylü",
    description:
      "Tek cihazla, masa etrafında oynanan Vampir Köylü. Gizli rol dağıtımı, gece görevleri, tartışma sayacı ve oylama.",
    // Göreli yol: uygulama kökte de (Vercel) alt yolda da (GitHub Pages) çalışsın.
    start_url: "./",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1020",
    theme_color: "#0b1020",
    lang: "tr",
    icons: [{ src: "./icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
