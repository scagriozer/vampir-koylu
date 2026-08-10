"use client";

import { useState } from "react";
import {
  ROLLER,
  doktorYasakHedef,
  hayattaOlanlar,
  moderatorGeceSirasindaki,
  oyuncuBul,
  type OyunDurumu,
} from "@/lib/oyun/vampirKoylu";
import { MasaGorunumu } from "./MasaGorunumu";
import { Baslik, Buton, Panel } from "./ui";

interface ModeratorGeceEkraniProps {
  durum: OyunDurumu;
  onHedefSec: (hedefId: number) => void;
  onSirayiTamamla: () => void;
}

/**
 * Moderatörlü oyunda gece: cihaz moderatörde kalır, hiç el değiştirmez.
 * Moderatör zaten tüm rolleri bildiği için (bkz. Kadro ekranı) koltuk sırasıyla
 * dolaşıp gizlemeye gerek yoktur — roller sırayla (vampir → doktor → gözcü)
 * çağrılır, moderatör oyuncuların işaretiyle hedefi masadan seçip uygulamaya
 * girer. Aynı roldeki herkes tek bir ortak seçime tabidir (klasik masa
 * oyununda da vampirler/doktor/gözcü grubu moderatöre tek işaretle bildirir).
 */
export function ModeratorGeceEkrani({ durum, onHedefSec, onSirayiTamamla }: ModeratorGeceEkraniProps) {
  const rolId = moderatorGeceSirasindaki(durum);
  const [gozcuRaporu, setGozcuRaporu] = useState(false);

  if (!rolId) return null;

  const rol = ROLLER[rolId];
  const hayatta = hayattaOlanlar(durum.oyuncular);
  const grup = hayatta.filter((o) => o.rol === rolId);
  const secim = durum.buSiradakiSecim;
  const hedefOyuncu = oyuncuBul(durum.oyuncular, secim);

  // — Gözcünün raporu: moderatör zaten biliyor ama akışı netleştirmek için gösterilir —
  if (gozcuRaporu && hedefOyuncu) {
    const hedefVampirMi = ROLLER[hedefOyuncu.rol].takim === "vampir";
    return (
      <div className="space-y-6">
        <Baslik ustBaslik="Gözcü raporu" baslik={hedefOyuncu.ad} />
        <div
          className={`mx-auto flex max-w-sm flex-col items-center gap-2 rounded-3xl border p-8 text-center ${
            hedefVampirMi ? "border-red-400/40 bg-red-500/10" : "border-emerald-400/40 bg-emerald-500/10"
          }`}
        >
          <span className="text-6xl" aria-hidden>
            {hedefVampirMi ? "🧛" : "🕊️"}
          </span>
          <p className={`text-2xl font-black ${hedefVampirMi ? "text-red-200" : "text-emerald-200"}`}>
            {hedefVampirMi ? "VAMPİR!" : "Vampir değil"}
          </p>
          <p className="text-sm text-white/60">Bunu gözcü oyuncuya (oyunculara) gizlice ilet.</p>
        </div>
        <Buton tamGenislik onClick={onSirayiTamamla}>
          ➡️ Sıradaki role geç
        </Buton>
      </div>
    );
  }

  const yasakHedef = rolId === "doktor" ? doktorYasakHedef(durum, grup[0]?.id ?? -1) : null;
  // Vampir/gözcü kendi rol grubunu hedefleyemez (vampirler birbirini öldüremez,
  // gözcü(ler) kendini/ekibini inceleyemez); doktor kendini de koruyabilir.
  const secilebilirIdler = hayatta
    .filter((o) => (rolId === "doktor" ? o.id !== yasakHedef : !grup.some((m) => m.id === o.id)))
    .map((o) => o.id);

  return (
    <div className="space-y-4">
      <Baslik
        ustBaslik={`${durum.gun}. gece · Moderatör`}
        baslik={
          rolId === "vampir"
            ? "Vampirler kimi avlıyor?"
            : rolId === "doktor"
              ? "Doktor kimi koruyor?"
              : "Gözcü kimi inceliyor?"
        }
        aciklama={`${grup.map((o) => o.ad).join(", ")} sessizce işaret etsin; seçtiğini masadan gir.`}
      />

      <MasaGorunumu
        gece
        oyuncular={durum.oyuncular}
        rolleriGoster
        secilebilirIdler={secilebilirIdler}
        seciliId={secim}
        onSec={onHedefSec}
        merkez={
          <div className="space-y-1">
            <p className="text-4xl" aria-hidden>
              {rol.emoji}
            </p>
            <p className="text-sm font-bold text-white">
              {hedefOyuncu ? hedefOyuncu.ad : "Bir koltuğa dokun"}
            </p>
          </div>
        }
      />

      {yasakHedef !== null && (
        <Panel className="!py-3">
          <p className="text-center text-xs text-white/60">
            Dün gece {oyuncuBul(durum.oyuncular, yasakHedef)?.ad} korundu; bu gece tekrar seçilemez.
          </p>
        </Panel>
      )}

      <Buton
        tamGenislik
        disabled={secim === null}
        onClick={() => (rolId === "gozcu" ? setGozcuRaporu(true) : onSirayiTamamla())}
      >
        {rolId === "vampir"
          ? "🩸 Avlarını gir"
          : rolId === "doktor"
            ? "💉 Korumasını gir"
            : "🔮 İncelemesini gir"}
      </Buton>
    </div>
  );
}
