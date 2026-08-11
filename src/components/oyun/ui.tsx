"use client";

import { useEffect, useState } from "react";
import { sesleriEtkinlestir } from "@/lib/oyun/sesler";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButonTonu = "birincil" | "ikincil" | "tehlike" | "hayalet";

const TONLAR: Record<ButonTonu, string> = {
  birincil:
    "bg-amber-300 text-[#1a1208] hover:bg-amber-200 disabled:bg-white/15 disabled:text-white/40",
  ikincil:
    "bg-white/10 text-white ring-1 ring-inset ring-white/20 hover:bg-white/15 disabled:text-white/30",
  tehlike:
    "bg-red-600 text-white hover:bg-red-500 disabled:bg-white/15 disabled:text-white/40",
  hayalet:
    "bg-transparent text-white/70 ring-1 ring-inset ring-white/15 hover:bg-white/5 hover:text-white",
};

interface ButonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ton?: ButonTonu;
  tamGenislik?: boolean;
}

// Aşama atlama koruması: ekranlar arası butonlar çoğu zaman aynı konumda
// olduğundan, çift/hızlı dokunuş bir önceki ekrana basılan parmağın ikinci
// temasını yeni ekranın butonuna iletebiliyor (ör. "Avımı seçtim" dokunuşu
// sıradaki oyuncunun "Sıra bende" butonuna sızıp o oyuncunun ekranını
// istemsizce açabiliyor). Buton ekrana geldikten sonraki kısa süre boyunca
// GERÇEKTEN disabled tutulur — yalnızca tıklama olayını JS içinde yok
// saymak yerine, tarayıcı bu süre boyunca dokunuşu hiç butona iletmez.
const KORUMA_SURESI_MS = 500;

export function Buton({
  ton = "birincil",
  tamGenislik = false,
  className = "",
  children,
  onClick,
  disabled,
  ...props
}: ButonProps) {
  const [korumaAktif, setKorumaAktif] = useState(true);
  useEffect(() => {
    const zamanlayici = setTimeout(() => setKorumaAktif(false), KORUMA_SURESI_MS);
    return () => clearTimeout(zamanlayici);
  }, []);

  return (
    <button
      {...props}
      disabled={disabled || korumaAktif}
      onClick={(e) => {
        // iOS ses bağlamı yalnızca dokunuş içinde açılabilir.
        sesleriEtkinlestir();
        onClick?.(e);
      }}
      // min-h-11: iOS'ta önerilen 44pt dokunma hedefi.
      // touch-manipulation: hızlı arka arkaya dokunuşta çift dokunma yakınlaştırmasını kapatır.
      className={`inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold uppercase tracking-wide transition-colors disabled:cursor-not-allowed ${
        TONLAR[ton]
      } ${tamGenislik ? "w-full" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Baslik({
  ustBaslik,
  baslik,
  aciklama,
}: {
  ustBaslik?: string;
  baslik: string;
  aciklama?: ReactNode;
}) {
  return (
    <header className="text-center">
      {ustBaslik && (
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300/80">{ustBaslik}</p>
      )}
      <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">{baslik}</h2>
      {aciklama && <p className="mx-auto mt-2 max-w-md text-sm text-white/70">{aciklama}</p>}
    </header>
  );
}
