"use client";

import { type OyunDurumu } from "@/lib/oyun/vampirKoylu";
import { MasaGorunumu } from "../oyun/MasaGorunumu";
import { Baslik } from "../oyun/ui";

/**
 * Sıra bende değilken gösterilen ekran: masayı ambiyans için gösterir, kimin
 * sırasında olduğunu söyler, hiçbir kontrol vermez. Tek cihazlı moddaki
 * "cihazı devret" ekranlarının ağ karşılığı.
 */
export function AgBekleme({ durum, siradaki }: { durum: OyunDurumu; siradaki: string }) {
  return (
    <div className="space-y-6">
      <Baslik ustBaslik="Bekleniyor" baslik={`${siradaki} oynuyor…`} aciklama="Sıra sana gelince ekran otomatik değişecek." />
      <MasaGorunumu oyuncular={durum.oyuncular} oluRolleriGoster={durum.ayarlar.olulerinRoluAcik} gece={durum.asama === "gece"} />
    </div>
  );
}
