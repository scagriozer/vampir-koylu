"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Baslik, Buton, Panel } from "./ui";

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

const AgOyunu = dynamic(() => import("../ag/AgOyunu").then((m) => m.AgOyunu), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_at_top,#1d2440,#0b1020_60%)] text-sm text-white/40">
      Bağlanılıyor…
    </div>
  ),
});

function ModSecimEkrani({ onTekCihaz, onAg }: { onTekCihaz: () => void; onAg: () => void }) {
  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-4 py-10">
      <Baslik
        ustBaslik="Vampir Köylü"
        baslik="Nasıl oynayacaksınız?"
        aciklama="İki oynanış tarzı da aynı motoru kullanır, istediğiniz an değiştirebilirsiniz."
      />
      <Panel className="space-y-3">
        <Buton tamGenislik onClick={onTekCihaz}>
          📱 Tek cihaz · aynı masada
        </Buton>
        <p className="text-center text-xs text-white/50">
          Telefon elden ele dolaşır, herkes aynı masada oturur.
        </p>
      </Panel>
      <Panel className="space-y-3">
        <Buton tamGenislik ton="ikincil" onClick={onAg}>
          🌐 Ağ üzerinden · beta
        </Buton>
        <p className="text-center text-xs text-white/50">
          Herkes kendi telefonuyla oynar; oda kodu ile bağlanılır.
        </p>
      </Panel>
    </div>
  );
}

export function VampirKoyluIstemci() {
  const [mod, setMod] = useState<"secim" | "tek" | "ag">("secim");
  if (mod === "tek") return <VampirKoyluOyun />;
  if (mod === "ag") return <AgOyunu onKapat={() => setMod("secim")} />;
  return <ModSecimEkrani onTekCihaz={() => setMod("tek")} onAg={() => setMod("ag")} />;
}
