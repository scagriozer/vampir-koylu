"use client";

import { useEffect, useState } from "react";
import {
  ROLLER,
  doktorYasakHedef,
  geceSirasindaki,
  hayattaOlanlar,
  oyuncuBul,
  type OyunDurumu,
} from "@/lib/oyun/vampirKoylu";
import { MasaGorunumu } from "./MasaGorunumu";
import { Baslik, Buton, Panel } from "./ui";

interface GeceEkraniProps {
  durum: OyunDurumu;
  onHedefSec: (hedefId: number) => void;
  onSirayiTamamla: () => void;
  /**
   * "Sıra bende" dokunuşuyla gerçek ekran arasına sabit bir bekleme koyar.
   * Görevi olan oyuncu (hedef seçer) ile olmayan (tek dokunuşla geçer) arasındaki
   * el değiştirme SÜRESİ farklı olursa, bu fark başlı başına bir sızıntıdır — hızlı
   * geçen köylüdür, yavaş geçen görev sahibidir. Sabit bekleme bu farkı yok eder.
   * Ağ üzerinden oyunda cihaz zaten el değiştirmediği için (bkz. AgOyunu) false verilir.
   */
  sayimliBekleme?: boolean;
}

const BEKLEME_SURESI_MS = 3000;

/**
 * Gece, rol çağırarak değil, cihazı koltuk sırasıyla HERKESE gezdirerek işler.
 * Devir ekranı ve kapanış ekranı her oyuncuda birebir aynıdır; gece görevi
 * olmayan köylü de sırasını alır. Böylece masadakiler ekrandan kimin hangi role
 * sahip olduğunu çıkaramaz.
 */
export function GeceEkrani({ durum, onHedefSec, onSirayiTamamla, sayimliBekleme = true }: GeceEkraniProps) {
  const oyuncu = geceSirasindaki(durum);
  // Bileşen her sırada `key` ile sıfırlanır (bkz. VampirKoyluOyun).
  const [devralindi, setDevralindi] = useState(false);
  const [beklemeBitti, setBeklemeBitti] = useState(!sayimliBekleme);
  const [gozcuRaporu, setGozcuRaporu] = useState(false);

  useEffect(() => {
    if (!devralindi || !sayimliBekleme) return;
    const zamanlayici = setTimeout(() => setBeklemeBitti(true), BEKLEME_SURESI_MS);
    return () => clearTimeout(zamanlayici);
  }, [devralindi, sayimliBekleme]);

  if (!oyuncu) return null;

  const rol = ROLLER[oyuncu.rol];
  const hayatta = hayattaOlanlar(durum.oyuncular);
  const secim = durum.buSiradakiSecim;
  const hedefOyuncu = oyuncuBul(durum.oyuncular, secim);

  // — 1. Cihaz devri: bu ekran her oyuncuda kelimesi kelimesine aynı —
  if (!devralindi) {
    return (
      <div className="space-y-6">
        <Baslik
          ustBaslik={`${durum.gun}. gece · sıra ${durum.geceSira + 1}/${hayatta.length}`}
          baslik={`Cihaz ${oyuncu.ad}'de`}
          aciklama="Ekranı kimse görmesin. Sıra herkese gelecek; gece görevin olsun ya da olmasın."
        />
        <div className="flex justify-center py-8 text-7xl" aria-hidden>
          🌙
        </div>
        <Buton tamGenislik onClick={() => setDevralindi(true)}>
          👁️ Sıra bende
        </Buton>
      </div>
    );
  }

  // — 2. Sabit bekleme: görev olsun olmasın bu ekran aynı süre kalır, bkz. yukarı —
  if (!beklemeBitti) {
    return (
      <div className="space-y-6">
        <Baslik ustBaslik={`${durum.gun}. gece`} baslik="Hazırlan…" aciklama="Ekran birazdan açılacak." />
        <div className="flex justify-center py-10" aria-hidden>
          <span className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-white/15 border-t-amber-300" />
        </div>
      </div>
    );
  }

  // — Gece görevi olmayan roller: aynı sayıda dokunuşla akışa katılır —
  if (!rol.geceGorevi) {
    return (
      <div className="space-y-6">
        <Baslik ustBaslik={`${durum.gun}. gece`} baslik="Bu gece uyuyorsun" aciklama={rol.gorev} />
        <div className="flex justify-center py-8 text-7xl" aria-hidden>
          😴
        </div>
        <Buton tamGenislik ton="ikincil" onClick={onSirayiTamamla}>
          🔒 Kapat · sıradakine ver
        </Buton>
      </div>
    );
  }

  // — Gözcünün raporu —
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
          <p className="text-sm text-white/60">
            Bu bilgiyi gündüz nasıl kullanacağın sana kalmış — açık konuşursan hedef olabilirsin.
          </p>
        </div>
        <Buton tamGenislik ton="ikincil" onClick={onSirayiTamamla}>
          🔒 Kapat · sıradakine ver
        </Buton>
      </div>
    );
  }

  // — Hedef seçimi —
  const vampirMi = oyuncu.rol === "vampir";
  const digerVampirler = vampirMi ? hayatta.filter((o) => o.rol === "vampir" && o.id !== oyuncu.id) : [];
  const yasakHedef = oyuncu.rol === "doktor" ? doktorYasakHedef(durum, oyuncu.id) : null;

  const secilebilirIdler = hayatta
    .filter((o) => {
      if (vampirMi) return o.rol !== "vampir";
      if (oyuncu.rol === "doktor") return o.id !== yasakHedef;
      return o.id !== oyuncu.id; // gözcü kendini inceleyemez
    })
    .map((o) => o.id);

  // Sırası daha önce gelmiş vampir arkadaşların seçimleri. Vampirler zaten
  // birbirini tanıdığı için bu bilgi dışarı sızmaz.
  const arkadasSecimleri = vampirMi
    ? Object.entries(durum.vampirSecimleri)
        .filter(([id]) => Number(id) !== oyuncu.id)
        .map(([id, hedef]) => ({
          vampir: oyuncuBul(durum.oyuncular, Number(id)),
          hedef: oyuncuBul(durum.oyuncular, hedef),
        }))
        .filter((s): s is { vampir: NonNullable<typeof s.vampir>; hedef: NonNullable<typeof s.hedef> } =>
          Boolean(s.vampir && s.hedef),
        )
    : [];

  const rozetler: Record<number, string> = {};
  arkadasSecimleri.forEach((s) => {
    rozetler[s.hedef.id] = "🩸";
  });

  return (
    <div className="space-y-4">
      <Baslik
        ustBaslik={`${durum.gun}. gece · ${oyuncu.ad}`}
        baslik={
          vampirMi
            ? "Bu gece kimi avlıyorsun?"
            : oyuncu.rol === "doktor"
              ? "Bu gece kimi koruyorsun?"
              : "Bu gece kimi inceliyorsun?"
        }
        aciklama={
          vampirMi && digerVampirler.length > 0
            ? `Diğer vampirler: ${digerVampirler.map((o) => o.ad).join(", ")}. Aynı kişide birleşmezseniz kurban çoğunluğa göre belirlenir.`
            : rol.gorev
        }
      />

      <MasaGorunumu
        gece
        oyuncular={durum.oyuncular}
        oluRolleriGoster={durum.ayarlar.olulerinRoluAcik}
        secilebilirIdler={secilebilirIdler}
        seciliId={secim}
        onSec={onHedefSec}
        // Oyuncu kendi rolünü görür; vampir ek olarak diğer vampirleri tanır.
        rolGorunenIdler={vampirMi ? [oyuncu.id, ...digerVampirler.map((o) => o.id)] : [oyuncu.id]}
        rozetler={rozetler}
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

      {arkadasSecimleri.length > 0 && (
        <Panel className="!py-3">
          <p className="text-center text-xs text-white/60">
            {arkadasSecimleri.map((s) => `${s.vampir.ad} → ${s.hedef.ad}`).join(" · ")}
          </p>
        </Panel>
      )}

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
        onClick={() => (oyuncu.rol === "gozcu" ? setGozcuRaporu(true) : onSirayiTamamla())}
      >
        {vampirMi ? "🩸 Avımı seçtim" : oyuncu.rol === "doktor" ? "💉 Bu kişiyi koru" : "🔮 Bu kişiyi incele"}
      </Buton>
    </div>
  );
}
