"use client";

import { ROLLER, type Oyuncu } from "@/lib/oyun/vampirKoylu";
import { Baslik, Buton, Panel } from "./ui";

interface DagitimEkraniProps {
  oyuncu: Oyuncu;
  sira: number;
  toplam: number;
  acik: boolean;
  onAc: () => void;
  onKapat: () => void;
}

/**
 * "Yan yanayken görev atama" adımı: cihaz sırayla her oyuncuya verilir,
 * oyuncu kartını açıp rolünü gizlice görür ve kapatıp cihazı devreder.
 */
export function DagitimEkrani({ oyuncu, sira, toplam, acik, onAc, onKapat }: DagitimEkraniProps) {
  const rol = ROLLER[oyuncu.rol];
  const sonuncu = sira === toplam - 1;

  return (
    <div className="space-y-6">
      <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-white/50">
        Rol dağıtımı · {sira + 1}/{toplam}
      </p>

      {!acik ? (
        <>
          <Baslik
            baslik={`Cihaz ${oyuncu.ad}'de`}
            aciklama="Kimse ekranı görmesin. Hazır olduğunda kartını aç, rolünü ezberle ve kapat."
          />
          <div className="flex justify-center py-4">
            <div className="flex h-64 w-48 items-center justify-center rounded-3xl border-2 border-dashed border-white/20 bg-white/[0.04] text-6xl">
              🂠
            </div>
          </div>
          <Buton tamGenislik onClick={onAc}>
            👁️ Kartımı göster
          </Buton>
        </>
      ) : (
        <>
          <p className="text-center text-sm font-semibold text-white/70">{oyuncu.ad}, rolün:</p>
          <div className="flex justify-center py-2">
            <div
              className="flex h-64 w-48 flex-col items-center justify-center gap-2 rounded-3xl border border-white/20 p-4 text-center shadow-2xl"
              style={{ background: `linear-gradient(160deg, ${rol.renk[0]}, ${rol.renk[1]})` }}
            >
              <span className="text-6xl" aria-hidden>
                {rol.emoji}
              </span>
              <span className="text-2xl font-black text-white">{rol.ad}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${
                  rol.takim === "vampir"
                    ? "bg-red-950/70 text-red-200"
                    : rol.takim === "koy"
                      ? "bg-emerald-950/70 text-emerald-200"
                      : "bg-fuchsia-950/70 text-fuchsia-200"
                }`}
              >
                {rol.takim === "vampir" ? "Vampir takımı" : rol.takim === "koy" ? "Köy takımı" : "Tarafsız"}
              </span>
            </div>
          </div>
          <Panel className="!py-4">
            <p className="text-sm leading-relaxed text-white/80">{rol.gorev}</p>
          </Panel>
          <Buton tamGenislik ton="ikincil" onClick={onKapat}>
            {sonuncu ? "✅ Gördüm · geceyi başlat" : "🔒 Gördüm · sıradaki oyuncuya ver"}
          </Buton>
        </>
      )}
    </div>
  );
}
