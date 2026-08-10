import type { OyunAksiyonu, OyunDurumu } from "@/lib/oyun/vampirKoylu";
import { guvenliRastgele } from "@/lib/oyun/vampirKoylu";

/** Bu cihazın oturum boyunca sabit, rastgele kimliği. */
export type CihazId = string;

export function cihazKimligiUret(): CihazId {
  return Math.floor(guvenliRastgele() * 36 ** 10).toString(36).padStart(10, "0");
}

const ODA_KOD_HARFLERI = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // karışabilecek 0/O, 1/I çıkarıldı

export function odaKoduUret(): string {
  let kod = "";
  for (let i = 0; i < 5; i++) {
    kod += ODA_KOD_HARFLERI[Math.floor(guvenliRastgele() * ODA_KOD_HARFLERI.length)];
  }
  return kod;
}

export function kanalAdi(odaKodu: string): string {
  return `vampir-koylu-oda-${odaKodu.trim().toUpperCase()}`;
}

export interface OdaOyuncusu {
  cihazId: CihazId;
  ad: string;
  foto: string | null;
}

/** İstemciden (host dahil herkesten) host'a giden mesajlar. */
export type IstemciMesaji =
  | { tip: "katil"; oyuncu: OdaOyuncusu }
  | { tip: "aksiyon"; cihazId: CihazId; aksiyon: OyunAksiyonu };

/** Host'tan odadaki herkese yayınlanan mesajlar. */
export type HostMesaji =
  | { tip: "lobi"; oyuncular: OdaOyuncusu[] }
  | { tip: "durum"; durum: OyunDurumu; kimlikler: Record<CihazId, number> }
  | { tip: "kapandi" };
