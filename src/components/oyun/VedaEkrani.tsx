"use client";

import { useEffect, useRef, useState } from "react";
import { giphyAra, giphyTrendler, giphyYapilandirilmisMi, type GifSonucu } from "@/lib/oyun/giphy";
import type { Oyuncu, OyuncuVeda } from "@/lib/oyun/vampirKoylu";
import { Baslik, Buton, Panel } from "./ui";

interface VedaEkraniProps {
  oyuncu: Oyuncu;
  onKaydet: (gifUrl: string, gifId: string, kelime: string | null) => void;
  onAtla: () => void;
}

/**
 * Ölen oyuncu cihazı bir kez daha devralır (gizli, "Sıra bende" kapısıyla —
 * bkz. GeceEkrani) ve bir GIF ile isteğe bağlı tek kelimelik bir veda bırakır.
 * Masaya döndüğünde mesaj herkese açık gösterilir (bkz. GunEkrani/BitisEkrani).
 */
export function VedaEkrani({ oyuncu, onKaydet, onAtla }: VedaEkraniProps) {
  const [devralindi, setDevralindi] = useState(false);

  if (!devralindi) {
    return (
      <div className="space-y-6">
        <Baslik
          ustBaslik="Veda mesajı"
          baslik={`Cihaz ${oyuncu.ad}'de`}
          aciklama="Ekranı kimse görmesin. Son sözünü bir GIF ve istersen tek kelimeyle bırak."
        />
        <div className="flex justify-center py-8 text-7xl" aria-hidden>
          🕯️
        </div>
        <Buton tamGenislik onClick={() => setDevralindi(true)}>
          👁️ Sıra bende
        </Buton>
      </div>
    );
  }

  return <VedaSecici oyuncu={oyuncu} onKaydet={onKaydet} onAtla={onAtla} />;
}

function VedaSecici({ oyuncu, onKaydet, onAtla }: VedaEkraniProps) {
  const yapilandirilmis = giphyYapilandirilmisMi();
  const [sorgu, setSorgu] = useState("");
  const [sonuclar, setSonuclar] = useState<GifSonucu[]>([]);
  const [yukleniyor, setYukleniyor] = useState(yapilandirilmis);
  const [hata, setHata] = useState<string | null>(null);
  const [secili, setSecili] = useState<GifSonucu | null>(null);
  const [kelime, setKelime] = useState("");
  // Yazarken art arda gelen aramalarda geç dönen eski yanıt yeniyi ezmesin diye.
  const istekSirasiRef = useRef(0);

  useEffect(() => {
    if (!yapilandirilmis) return;
    const sira = ++istekSirasiRef.current;
    const gecikme = sorgu.trim() ? 400 : 0;
    const zamanlayici = setTimeout(() => {
      setYukleniyor(true);
      setHata(null);
      const istek = sorgu.trim() ? giphyAra(sorgu.trim()) : giphyTrendler();
      istek
        .then((sonuc) => {
          if (istekSirasiRef.current !== sira) return;
          setSonuclar(sonuc);
        })
        .catch(() => {
          if (istekSirasiRef.current !== sira) return;
          setHata("GIF'ler yüklenemedi. Bağlantını kontrol et ya da yalnızca kelimeyle devam et.");
        })
        .finally(() => {
          if (istekSirasiRef.current !== sira) return;
          setYukleniyor(false);
        });
    }, gecikme);
    return () => clearTimeout(zamanlayici);
  }, [sorgu, yapilandirilmis]);

  function kelimeDegisti(deger: string) {
    // Tek kelime hakkı: boşluk (dolayısıyla ikinci kelime) girilemez.
    setKelime(deger.replace(/\s+/g, "").slice(0, 24));
  }

  const gonderilebilir = Boolean(secili || kelime.trim());

  function gonder() {
    if (!gonderilebilir) return;
    onKaydet(secili?.tamUrl ?? "", secili?.id ?? "", kelime.trim() || null);
  }

  return (
    <div className="space-y-4">
      <Baslik
        ustBaslik={`Veda mesajı · ${oyuncu.ad}`}
        baslik="Son sözün ne?"
        aciklama={
          yapilandirilmis
            ? "Bir GIF seç, istersen tek kelime de ekle. İkisi de opsiyonel."
            : "GIF araması bu masada açık değil; istersen tek kelimelik bir veda bırakabilirsin."
        }
      />

      {yapilandirilmis && (
        <>
          <input
            value={sorgu}
            onChange={(e) => setSorgu(e.target.value)}
            placeholder="GIF ara… (boş bırakırsan gündemdekiler)"
            className="w-full rounded-xl bg-black/20 px-4 py-3 text-base text-white outline-none ring-1 ring-inset ring-white/10 placeholder:text-white/30 focus:ring-amber-300/50"
            aria-label="GIF ara"
          />

          {secili ? (
            <Panel className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- statik export, uzak GIF; next/image gereksiz */}
              <img src={secili.tamUrl} alt={secili.baslik} className="max-h-56 rounded-xl" />
              <button
                type="button"
                onClick={() => setSecili(null)}
                className="inline-flex min-h-11 items-center px-2 text-xs font-semibold text-white/50 underline-offset-2 hover:text-white/80 hover:underline"
              >
                Başka bir GIF seç
              </button>
            </Panel>
          ) : yukleniyor ? (
            <p className="py-8 text-center text-sm text-white/50">GIF&apos;ler yükleniyor…</p>
          ) : hata ? (
            <p className="py-8 text-center text-sm text-red-300">{hata}</p>
          ) : sonuclar.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/50">Sonuç yok, başka bir şey dene.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {sonuclar.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSecili(g)}
                  className="aspect-square overflow-hidden rounded-xl bg-black/20 ring-1 ring-inset ring-white/10 transition-transform active:scale-95"
                  aria-label={g.baslik || "GIF seç"}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- statik export, uzak GIF; next/image gereksiz */}
                  <img src={g.onizlemeUrl} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <input
        value={kelime}
        onChange={(e) => kelimeDegisti(e.target.value)}
        maxLength={24}
        placeholder="Tek kelimelik son sözün (opsiyonel)"
        className="w-full rounded-xl bg-black/20 px-4 py-3 text-base text-white outline-none ring-1 ring-inset ring-white/10 placeholder:text-white/30 focus:ring-amber-300/50"
        aria-label="Veda kelimesi"
      />

      <div className="flex gap-2">
        <Buton ton="hayalet" tamGenislik onClick={onAtla}>
          Atla
        </Buton>
        <Buton tamGenislik disabled={!gonderilebilir} onClick={gonder}>
          💌 Veda mesajını bırak
        </Buton>
      </div>
    </div>
  );
}

/** Veda mesajını (GIF + kelime) tüm masaya gösteren kart; GunEkrani ve BitisEkrani'nde kullanılır. */
export function VedaKarti({ veda }: { veda: OyuncuVeda }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      {veda.gifUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- statik export, uzak GIF; next/image gereksiz
        <img src={veda.gifUrl} alt="" className="max-h-48 rounded-xl" />
      )}
      {veda.kelime && <p className="text-lg font-black italic text-amber-200">&quot;{veda.kelime}&quot;</p>}
    </div>
  );
}
