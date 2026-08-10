"use client";

import { ROLLER, type Oyuncu } from "@/lib/oyun/vampirKoylu";
import { Avatar } from "../oyun/Avatar";
import { Baslik, Buton, Panel } from "../oyun/ui";

/**
 * Ağ modunda rol dağıtımı `dagitim` aşamasını atlar (bkz. `dagitimiAtla`): her
 * oyuncu rolünü zaten yalnızca kendi cihazında görür, cihaz elden ele geçmez.
 * Bu kart, o cihaza özel, yalnızca yerelde tutulan (senkronize edilmeyen) bir
 * "gördüm" onayıdır — motor durumunu etkilemez.
 */
export function RolKarti({ oyuncu, onGordum }: { oyuncu: Oyuncu; onGordum: () => void }) {
  const rol = ROLLER[oyuncu.rol];

  return (
    <div className="space-y-6">
      <Baslik ustBaslik="Yalnızca sende" baslik={`${oyuncu.ad}, rolün:`} />
      <div className="flex justify-center py-2">
        <div
          className="flex h-64 w-48 flex-col items-center justify-center gap-2 rounded-3xl border border-white/20 p-4 text-center shadow-2xl"
          style={{ background: `linear-gradient(160deg, ${rol.renk[0]}, ${rol.renk[1]})` }}
        >
          {oyuncu.foto ? (
            <Avatar foto={oyuncu.foto} emoji={rol.emoji} rol={rol} boyutRem={6.5} />
          ) : (
            <span className="text-6xl" aria-hidden>
              {rol.emoji}
            </span>
          )}
          <span className="text-2xl font-black text-white">{rol.ad}</span>
        </div>
      </div>
      <Panel className="!py-4">
        <p className="text-sm leading-relaxed text-white/80">{rol.gorev}</p>
      </Panel>
      <Buton tamGenislik onClick={onGordum}>
        ✅ Gördüm, oyuna devam et
      </Buton>
    </div>
  );
}
