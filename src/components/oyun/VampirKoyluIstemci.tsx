"use client";

import dynamic from "next/dynamic";

/**
 * Oyun tamamen istemci tarafında çalışır (localStorage'daki masayı ilk render'da
 * okuyabilmesi için SSR kapalı). Böylece devam eden bir oyun, sayfa yenilendiğinde
 * kurulum ekranı hiç görünmeden kaldığı yerden açılır.
 */
const VampirKoyluOyun = dynamic(
  () => import("./VampirKoyluOyun").then((m) => m.VampirKoyluOyun),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_at_top,#1d2440,#0b1020_60%)] text-sm text-white/40">
        Masa hazırlanıyor…
      </div>
    ),
  },
);

export function VampirKoyluIstemci() {
  return <VampirKoyluOyun />;
}
