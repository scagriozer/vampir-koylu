"use client";

import { hayattaOlanlar, type OyunDurumu } from "@/lib/oyun/vampirKoylu";
import { MasaGorunumu } from "./MasaGorunumu";
import { Baslik, Buton } from "./ui";

function KadroListesi({ durum }: { durum: OyunDurumu }) {
  const hayatta = hayattaOlanlar(durum.oyuncular).length;
  return (
    <MasaGorunumu
      oyuncular={durum.oyuncular}
      rolleriGoster
      merkez={
        <div className="space-y-1">
          <p className="text-3xl" aria-hidden>
            🎭
          </p>
          <p className="text-sm font-bold text-white">
            {hayatta}/{durum.oyuncular.length} hayatta
          </p>
        </div>
      }
    />
  );
}

/**
 * Moderatörlü oyunda ilk rol dağıtımı: cihaz hiç el değiştirmez, moderatör
 * tüm kadroyu tek ekranda görür ve oyunculara ayrıca (uygulama dışında,
 * gizlice) bildirir.
 */
export function ModKadroEkrani({ durum, onBasla }: { durum: OyunDurumu; onBasla: () => void }) {
  return (
    <div className="space-y-6">
      <Baslik
        ustBaslik="Moderatör · yalnızca sende"
        baslik="Kadro hazır"
        aciklama="Roller aşağıda. Oyunculara kendi rollerini ayrı ayrı, gizlice söyle; hazır olduğunda geceyi başlat."
      />
      <KadroListesi durum={durum} />
      <Buton tamGenislik onClick={onBasla}>
        🌙 Geceyi başlat
      </Buton>
    </div>
  );
}

/** Oyun sırasında moderatörün kadroya tekrar bakabilmesi için modal. */
export function KadroModal({ durum, onKapat }: { durum: OyunDurumu; onKapat: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Kadro"
      onClick={onKapat}
    >
      <div
        className="max-h-[85dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-3xl border border-white/10 bg-[#131a2f] p-6 sm:rounded-3xl"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-black text-white">Kadro</h3>
        <p className="mb-4 mt-1 text-sm text-white/60">Yalnızca sen görüyorsun.</p>
        <KadroListesi durum={durum} />
        <div className="mt-6">
          <Buton tamGenislik ton="ikincil" onClick={onKapat}>
            Kapat
          </Buton>
        </div>
      </div>
    </div>
  );
}
