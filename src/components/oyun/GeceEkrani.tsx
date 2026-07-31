"use client";

import { useState } from "react";
import {
  ROLLER,
  doktorYasakHedef,
  geceAdimlari,
  hayattaOlanlar,
  oyuncuBul,
  type OyunDurumu,
  type RolId,
} from "@/lib/oyun/vampirKoylu";
import { MasaGorunumu } from "./MasaGorunumu";
import { Baslik, Buton, Panel } from "./ui";

interface GeceEkraniProps {
  durum: OyunDurumu;
  onHedefSec: (hedefId: number) => void;
  onGozcuSonucunuGor: () => void;
  onAdimTamamla: () => void;
}

const CAGRI: Record<RolId, string> = {
  vampir: "Vampirler uyansın",
  doktor: "Doktor uyansın",
  gozcu: "Gözcü uyansın",
  koylu: "Köylüler uyusun",
};

export function GeceEkrani({
  durum,
  onHedefSec,
  onGozcuSonucunuGor,
  onAdimTamamla,
}: GeceEkraniProps) {
  const adimlar = geceAdimlari(durum.oyuncular);
  const aktifRol = adimlar[durum.geceAdim];
  // Sıra yeni role geçtiğinde bileşen `key` ile sıfırlanır (bkz. VampirKoyluOyun),
  // böylece ekran her seferinde "cihazı devret" adımından başlar.
  const [devralindi, setDevralindi] = useState(false);

  if (!aktifRol) return null;

  const rol = ROLLER[aktifRol];
  const hayatta = hayattaOlanlar(durum.oyuncular);
  const rolOyunculari = hayatta.filter((o) => o.rol === aktifRol);
  const oyuncuAdlari = rolOyunculari.map((o) => o.ad).join(", ");

  const seciliHedef =
    aktifRol === "vampir" ? durum.vampirHedef : aktifRol === "doktor" ? durum.doktorHedef : durum.gozcuHedef;

  const yasakDoktorHedefi = doktorYasakHedef(durum);
  const secilebilirIdler = hayatta
    .filter((o) => {
      if (aktifRol === "vampir") return o.rol !== "vampir";
      if (aktifRol === "doktor") return o.id !== yasakDoktorHedefi;
      if (aktifRol === "gozcu") return o.rol !== "gozcu";
      return false;
    })
    .map((o) => o.id);

  const hedefOyuncu = oyuncuBul(durum.oyuncular, seciliHedef);
  const gozcuSonucAsamasi = aktifRol === "gozcu" && seciliHedef !== null && durum.gozcuSonucGoruldu;

  // — 1. Cihaz devri —
  if (!devralindi) {
    return (
      <div className="space-y-6">
        <Baslik
          ustBaslik={`${durum.gun}. gece · sıra ${durum.geceAdim + 1}/${adimlar.length}`}
          baslik={CAGRI[aktifRol]}
          aciklama={
            <>
              Herkes gözlerini kapatsın. Cihaz <strong className="text-white">{oyuncuAdlari}</strong>{" "}
              oyuncusuna verilsin. Hazır olunca dokun.
            </>
          }
        />
        <div className="flex justify-center py-6 text-7xl">🌙</div>
        <Buton tamGenislik onClick={() => setDevralindi(true)}>
          {rol.emoji} {rol.ad} hazır
        </Buton>
      </div>
    );
  }

  // — 3. Gözcünün sonucu —
  if (gozcuSonucAsamasi && hedefOyuncu) {
    const vampirMi = ROLLER[hedefOyuncu.rol].takim === "vampir";
    return (
      <div className="space-y-6">
        <Baslik ustBaslik="Gözcü raporu" baslik={hedefOyuncu.ad} />
        <div
          className={`mx-auto flex max-w-sm flex-col items-center gap-2 rounded-3xl border p-8 text-center ${
            vampirMi
              ? "border-red-400/40 bg-red-500/10"
              : "border-emerald-400/40 bg-emerald-500/10"
          }`}
        >
          <span className="text-6xl" aria-hidden>
            {vampirMi ? "🧛" : "🕊️"}
          </span>
          <p className={`text-2xl font-black ${vampirMi ? "text-red-200" : "text-emerald-200"}`}>
            {vampirMi ? "VAMPİR!" : "Vampir değil"}
          </p>
          <p className="text-sm text-white/60">
            Bu bilgiyi gündüz nasıl kullanacağın sana kalmış — açık konuşursan hedef olabilirsin.
          </p>
        </div>
        <Buton tamGenislik ton="ikincil" onClick={onAdimTamamla}>
          🔒 Anladım · cihazı kapat
        </Buton>
      </div>
    );
  }

  // — 2. Hedef seçimi —
  const onaylaEtiketi =
    aktifRol === "vampir"
      ? "🩸 Avımızı seçtik"
      : aktifRol === "doktor"
        ? "💉 Bu kişiyi koru"
        : "🔮 Bu kişiyi incele";

  return (
    <div className="space-y-5">
      <Baslik
        ustBaslik={`${durum.gun}. gece`}
        baslik={
          aktifRol === "vampir"
            ? "Bu gece kimi avlıyorsunuz?"
            : aktifRol === "doktor"
              ? "Bu gece kimi koruyorsun?"
              : "Bu gece kimi inceliyorsun?"
        }
        aciklama={
          aktifRol === "vampir" && rolOyunculari.length > 1
            ? `Takım arkadaşların: ${oyuncuAdlari}. Fısıldayarak ortak karar verin.`
            : rol.gorev
        }
      />

      <MasaGorunumu
        gece
        oyuncular={durum.oyuncular}
        secilebilirIdler={secilebilirIdler}
        seciliId={seciliHedef}
        onSec={onHedefSec}
        // Vampirler yalnızca birbirini tanır; diğer roller kapalı kalır.
        rolGorunenIdler={aktifRol === "vampir" ? rolOyunculari.map((o) => o.id) : undefined}
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

      {aktifRol === "doktor" && yasakDoktorHedefi !== null && (
        <Panel className="!py-3">
          <p className="text-center text-xs text-white/60">
            Dün gece {oyuncuBul(durum.oyuncular, yasakDoktorHedefi)?.ad} korundu; bu gece tekrar
            seçilemez.
          </p>
        </Panel>
      )}

      <Buton
        tamGenislik
        disabled={seciliHedef === null}
        onClick={aktifRol === "gozcu" ? onGozcuSonucunuGor : onAdimTamamla}
      >
        {onaylaEtiketi}
      </Buton>
    </div>
  );
}
