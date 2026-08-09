"use client";

import type { ReactNode } from "react";
import { ROLLER, type Oyuncu } from "@/lib/oyun/vampirKoylu";

interface MasaGorunumuProps {
  oyuncular: Oyuncu[];
  /** Masanın ortasında görünen içerik (faz başlığı, sayaç vb.) */
  merkez?: ReactNode;
  /** Seçilebilir oyuncular; verilmezse hiçbiri tıklanamaz. */
  secilebilirIdler?: number[];
  seciliId?: number | null;
  onSec?: (id: number) => void;
  /** Ölülerin rolü her zaman açıktır; true ise yaşayanlarınki de gösterilir. */
  rolleriGoster?: boolean;
  /** Yalnızca bu oyuncuların rolü açık gösterilir (ör. vampirler birbirini görür). */
  rolGorunenIdler?: number[];
  /** Ölenlerin rolü masada görünsün mü? (oyun ayarı) */
  oluRolleriGoster?: boolean;
  /** Koltuk altında görünen küçük rozetler (ör. oy sayısı, "vampir dostun") */
  rozetler?: Record<number, string>;
  gece?: boolean;
}

/**
 * Oyuncuları yuvarlak bir masa etrafına dizen görsel tahta.
 * Koltuk konumları saat 12'den başlayarak eşit açılarla yerleştirilir.
 */
export function MasaGorunumu({
  oyuncular,
  merkez,
  secilebilirIdler,
  seciliId = null,
  onSec,
  rolleriGoster = false,
  rolGorunenIdler,
  oluRolleriGoster = true,
  rozetler,
  gece = false,
}: MasaGorunumuProps) {
  const toplam = oyuncular.length;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(88vw,30rem)] select-none">
      {/* Masa yüzeyi */}
      <div
        className={`absolute inset-[18%] rounded-full border transition-colors duration-700 ${
          gece
            ? "border-indigo-400/25 bg-[radial-gradient(circle_at_50%_35%,#1e2a52,#0b1024_70%)] shadow-[0_0_80px_-20px_rgba(99,102,241,0.6)_inset]"
            : "border-amber-300/30 bg-[radial-gradient(circle_at_50%_35%,#3b2f1c,#1a1208_70%)] shadow-[0_0_80px_-20px_rgba(251,191,36,0.5)_inset]"
        }`}
      />
      <div className="absolute inset-[18%] flex items-center justify-center rounded-full p-6 text-center">
        {merkez}
      </div>

      {oyuncular.map((oyuncu, i) => {
        const aci = (i / toplam) * 2 * Math.PI - Math.PI / 2;
        const yaricap = 42; // yüzde
        const x = 50 + yaricap * Math.cos(aci);
        const y = 50 + yaricap * Math.sin(aci);
        const secilebilir = !!secilebilirIdler?.includes(oyuncu.id) && !!onSec;
        const secili = seciliId === oyuncu.id;
        const rolGorunur =
          rolleriGoster ||
          (!oyuncu.hayatta && oluRolleriGoster) ||
          !!rolGorunenIdler?.includes(oyuncu.id);
        const rol = ROLLER[oyuncu.rol];

        return (
          <button
            key={oyuncu.id}
            type="button"
            disabled={!secilebilir}
            onClick={() => secilebilir && onSec?.(oyuncu.id)}
            style={{ left: `${x}%`, top: `${y}%` }}
            className={`absolute flex w-[22%] min-w-[4.5rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-2xl border px-1.5 py-2 text-center transition-all duration-200 ${
              !oyuncu.hayatta
                ? "border-white/10 bg-white/[0.03] opacity-55"
                : secili
                  ? "-translate-y-[calc(50%+4px)] border-amber-300 bg-amber-300/15 shadow-[0_0_24px_-4px_rgba(252,211,77,0.8)]"
                  : secilebilir
                    ? "border-white/20 bg-white/[0.06] hover:border-amber-200/70 hover:bg-amber-200/10 active:scale-95"
                    : "border-white/10 bg-white/[0.05]"
            } ${secilebilir ? "cursor-pointer" : "cursor-default"}`}
          >
            {/* Koltuk numarası: masada kimin kim olduğu karışmasın diye hep görünür. */}
            <span
              className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/15 text-[0.55rem] font-bold text-white/70"
              aria-hidden
            >
              {i + 1}
            </span>
            <span className="text-xl leading-none" aria-hidden>
              {oyuncu.hayatta ? (rolGorunur ? rol.emoji : "🎭") : "💀"}
            </span>
            <span
              className={`w-full truncate text-[0.7rem] font-semibold leading-tight ${
                oyuncu.hayatta ? "text-white" : "text-white/50 line-through"
              }`}
              title={oyuncu.ad}
            >
              {oyuncu.ad}
            </span>
            {rolGorunur && (
              <span className="w-full truncate text-[0.6rem] font-medium uppercase tracking-wide text-white/60">
                {rol.ad}
              </span>
            )}
            {rozetler?.[oyuncu.id] && (
              <span className="rounded-full bg-amber-300 px-1.5 py-0.5 text-[0.6rem] font-bold text-[#1a1208]">
                {rozetler[oyuncu.id]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
