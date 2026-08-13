"use client";

import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  MAKS_OYUNCU,
  MIN_OYUNCU,
  ROLLER,
  VARSAYILAN_AYARLAR,
  dagilimToplami,
  dagilimiOyuncuSayisinaGoreAyarla,
  varsayilanDagilim,
  type Ayarlar,
  type RolId,
} from "@/lib/oyun/vampirKoylu";
import { fotografiKareJpegYap } from "@/lib/oyun/foto";
import { Baslik, Buton, Panel } from "./ui";

const ROL_SIRASI: RolId[] = [
  "vampir",
  "doktor",
  "gozcu",
  "koylu",
  "kutsanmis",
  "veteran",
  "soytari",
  "sagkalan",
];
const VARSAYILAN_OYUNCU = 6;

interface KurulumEkraniProps {
  onBasla: (
    isimler: string[],
    dagilim: Record<RolId, number>,
    ayarlar: Ayarlar,
    fotolar: (string | null)[],
  ) => void;
}

export function KurulumEkrani({ onBasla }: KurulumEkraniProps) {
  const [isimler, setIsimler] = useState<string[]>(() =>
    Array.from({ length: VARSAYILAN_OYUNCU }, (_, i) => `Oyuncu ${i + 1}`),
  );
  const [fotolar, setFotolar] = useState<(string | null)[]>(() =>
    Array.from({ length: VARSAYILAN_OYUNCU }, () => null),
  );
  const [yukleniyorIndeks, setYukleniyorIndeks] = useState<number | null>(null);
  const dosyaGirdiRef = useRef<HTMLInputElement>(null);
  const [dagilim, setDagilim] = useState<Record<RolId, number>>(() =>
    varsayilanDagilim(VARSAYILAN_OYUNCU),
  );
  const [ayarlar, setAyarlar] = useState<Ayarlar>(VARSAYILAN_AYARLAR);
  const moderatorluAcik = ayarlar.moderatorAdi !== null;

  const oyuncuSayisi = isimler.length;
  const toplam = dagilimToplami(dagilim);

  const hata = useMemo(() => {
    if (toplam !== oyuncuSayisi) {
      const fark = oyuncuSayisi - toplam;
      return fark > 0
        ? `${fark} rol daha seçmelisin (toplam ${oyuncuSayisi} olmalı).`
        : `${-fark} rol fazla (toplam ${oyuncuSayisi} olmalı).`;
    }
    if (dagilim.vampir < 1) return "En az 1 vampir olmalı.";
    if (dagilim.vampir >= oyuncuSayisi - dagilim.vampir)
      return "Vampirler köylülerden az olmalı, yoksa oyun ilk gece biter.";
    return null;
  }, [dagilim, oyuncuSayisi, toplam]);

  function oyuncuSayisiniDegistir(yeni: number) {
    const sinirli = Math.min(MAKS_OYUNCU, Math.max(MIN_OYUNCU, yeni));
    setIsimler((onceki) => {
      if (sinirli <= onceki.length) return onceki.slice(0, sinirli);
      return [
        ...onceki,
        ...Array.from({ length: sinirli - onceki.length }, (_, i) => `Oyuncu ${onceki.length + i + 1}`),
      ];
    });
    setFotolar((onceki) => {
      if (sinirli <= onceki.length) return onceki.slice(0, sinirli);
      return [...onceki, ...Array.from({ length: sinirli - onceki.length }, () => null)];
    });
    setDagilim((onceki) => dagilimiOyuncuSayisinaGoreAyarla(onceki, sinirli));
  }

  // Mobil tarayıcılarda bazen tek dokunuş için iki "click" olayı ateşlenebiliyor
  // (ör. dokunuş + gecikmiş fare eşdeğeri) — bu, "2 → 0" gibi bir adımın atlandığı
  // izlenimi veriyordu. Aynı role çok kısa aralıkla gelen ikinci tetiklemeyi kilitle.
  const rolKilitliRef = useRef<Partial<Record<RolId, boolean>>>({});
  function rolAdediniDegistir(rol: RolId, fark: number) {
    if (rolKilitliRef.current[rol]) return;
    rolKilitliRef.current[rol] = true;
    setTimeout(() => {
      rolKilitliRef.current[rol] = false;
    }, 250);
    setDagilim((onceki) => ({ ...onceki, [rol]: Math.max(0, onceki[rol] + fark) }));
  }

  function fotoSecmeyiBaslat(indeks: number) {
    setYukleniyorIndeks(indeks);
    dosyaGirdiRef.current?.click();
  }

  async function dosyaSecildi(e: ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    e.target.value = ""; // aynı dosya tekrar seçilebilsin
    const indeks = yukleniyorIndeks;
    setYukleniyorIndeks(null);
    if (!dosya || indeks === null) return;
    try {
      const veriUrl = await fotografiKareJpegYap(dosya);
      setFotolar((onceki) => onceki.map((v, i) => (i === indeks ? veriUrl : v)));
    } catch {
      // Okunamayan/bozuk dosya: sessizce yoksay, oyuncu tekrar deneyebilir.
    }
  }

  function fotoSil(indeks: number) {
    setFotolar((onceki) => onceki.map((v, i) => (i === indeks ? null : v)));
  }

  return (
    <div className="space-y-6">
      <Baslik
        ustBaslik="Masayı kur"
        baslik="Kimler oynuyor?"
        aciklama="İsimleri masadaki oturma sırasına göre yaz. Roller karıştırılıp herkese gizlice dağıtılacak."
      />

      <Panel>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-white">Oyuncu sayısı</p>
            <p className="text-xs text-white/60">
              {MIN_OYUNCU}–{MAKS_OYUNCU} kişi · önerilen 6
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Buton
              ton="ikincil"
              className="!px-4 !py-2 text-lg"
              onClick={() => oyuncuSayisiniDegistir(oyuncuSayisi - 1)}
              disabled={oyuncuSayisi <= MIN_OYUNCU}
              aria-label="Oyuncu sayısını azalt"
            >
              −
            </Buton>
            <span className="w-8 text-center text-2xl font-black text-amber-300">{oyuncuSayisi}</span>
            <Buton
              ton="ikincil"
              className="!px-4 !py-2 text-lg"
              onClick={() => oyuncuSayisiniDegistir(oyuncuSayisi + 1)}
              disabled={oyuncuSayisi >= MAKS_OYUNCU}
              aria-label="Oyuncu sayısını artır"
            >
              +
            </Buton>
          </div>
        </div>

        <p className="mb-1 mt-3 text-[0.7rem] text-white/40">
          📷 Numaraya dokunup fotoğraf ekleyebilirsin (opsiyonel).
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {isimler.map((isim, i) => (
            <div key={i} className="flex min-h-11 items-center gap-2 rounded-xl bg-black/20 px-2 py-2">
              <button
                type="button"
                onClick={() => fotoSecmeyiBaslat(i)}
                className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/[0.06] text-xs font-bold text-amber-300/80"
                aria-label={
                  fotolar[i] ? `${i + 1}. oyuncunun fotoğrafını değiştir` : `${i + 1}. oyuncuya fotoğraf ekle`
                }
              >
                {fotolar[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- statik export, data URL; next/image gereksiz
                  <img src={fotolar[i] ?? undefined} alt="" className="h-full w-full object-cover" />
                ) : (
                  i + 1
                )}
              </button>
              <input
                value={isim}
                maxLength={18}
                onChange={(e) =>
                  setIsimler((onceki) => onceki.map((v, j) => (j === i ? e.target.value : v)))
                }
                onFocus={(e) => e.currentTarget.select()}
                // text-base (16px): daha küçüğünde iOS Safari alana dokununca sayfayı yakınlaştırır.
                className="w-full bg-transparent text-base font-semibold text-white outline-none placeholder:text-white/30"
                placeholder={`Oyuncu ${i + 1}`}
                aria-label={`${i + 1}. oyuncunun adı`}
              />
              {fotolar[i] && (
                <button
                  type="button"
                  onClick={() => fotoSil(i)}
                  className="shrink-0 rounded-full px-1.5 py-1 text-xs text-white/40 hover:text-white/70"
                  aria-label={`${i + 1}. oyuncunun fotoğrafını kaldır`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <input
          ref={dosyaGirdiRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={dosyaSecildi}
        />
      </Panel>

      <Panel>
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-bold text-white">Rol dağılımı</p>
          <button
            type="button"
            onClick={() => setDagilim(varsayilanDagilim(oyuncuSayisi))}
            className="-my-3 -mr-2 inline-flex min-h-11 items-center px-2 text-xs font-semibold text-amber-300 underline-offset-2 hover:underline"
          >
            Önerilene dön
          </button>
        </div>

        <ul className="mt-3 space-y-2">
          {ROL_SIRASI.map((rolId) => {
            const rol = ROLLER[rolId];
            return (
              <li
                key={rolId}
                className="flex items-center gap-3 rounded-xl bg-black/20 px-3 py-2"
              >
                <span className="text-xl" aria-hidden>
                  {rol.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">{rol.ad}</p>
                  <p className="truncate text-xs text-white/55">{rol.ozet}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Buton
                    ton="hayalet"
                    className="!px-3 !py-1"
                    onClick={() => rolAdediniDegistir(rolId, -1)}
                    disabled={dagilim[rolId] === 0}
                    aria-label={`${rol.ad} sayısını azalt`}
                  >
                    −
                  </Buton>
                  <span className="w-5 text-center text-base font-black text-white">
                    {dagilim[rolId]}
                  </span>
                  <Buton
                    ton="hayalet"
                    className="!px-3 !py-1"
                    onClick={() => rolAdediniDegistir(rolId, 1)}
                    aria-label={`${rol.ad} sayısını artır`}
                  >
                    +
                  </Buton>
                </div>
              </li>
            );
          })}
        </ul>

        <p
          className={`mt-3 text-center text-xs font-semibold ${
            hata ? "text-red-300" : "text-emerald-300"
          }`}
        >
          {hata ?? `Toplam ${toplam} rol · masa hazır.`}
        </p>
      </Panel>

      <Panel>
        <SecenekSatiri
          baslik="🎙️ Moderatörlü oyun"
          aciklama="Bir kişi moderatör olur, telefon hep onda kalır; kimse için el değiştirmez"
          acik={moderatorluAcik}
          onDegis={(v) =>
            setAyarlar((a) => ({
              ...a,
              moderatorAdi: v ? "" : null,
              gizliOylama: v ? false : a.gizliOylama,
            }))
          }
        />
        {moderatorluAcik && (
          <div className="mt-2 space-y-2">
            <label className="flex min-h-11 items-center gap-2 rounded-xl bg-black/20 px-3 py-2">
              <span className="shrink-0 text-xs font-bold text-amber-300/80">Ad</span>
              <input
                value={ayarlar.moderatorAdi ?? ""}
                onChange={(e) => setAyarlar((a) => ({ ...a, moderatorAdi: e.target.value }))}
                onFocus={(e) => e.currentTarget.select()}
                maxLength={18}
                placeholder="Moderatör (opsiyonel)"
                aria-label="Moderatörün adı"
                className="w-full bg-transparent text-base font-semibold text-white outline-none placeholder:text-white/30"
              />
            </label>
            <p className="px-1 text-xs leading-relaxed text-white/50">
              Moderatör oyuncu listesine dahil değildir, rol almaz. Roller yalnızca moderatörün
              ekranında görünür; oylama açık yürütülür.
            </p>
          </div>
        )}
      </Panel>

      <Panel>
        <p className="text-sm font-bold text-white">Oyun ayarları</p>

        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-xl bg-black/20 px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-white">Tartışma süresi</p>
              <p className="text-xs text-white/55">Gündüz konuşması için geri sayım</p>
            </div>
            <select
              value={ayarlar.tartismaSuresi}
              onChange={(e) => setAyarlar((a) => ({ ...a, tartismaSuresi: Number(e.target.value) }))}
              className="min-h-11 rounded-lg bg-white/10 px-3 py-2 text-base font-bold text-white outline-none"
              aria-label="Tartışma süresi"
            >
              {[60, 120, 180, 240, 300].map((sn) => (
                <option key={sn} value={sn} className="bg-[#141a2e]">
                  {sn / 60} dk
                </option>
              ))}
            </select>
          </div>

          {moderatorluAcik ? (
            <Panel className="!bg-black/20 !py-3">
              <p className="text-center text-xs text-white/60">
                Moderatörlü oyunda oylama her zaman açık yürütülür.
              </p>
            </Panel>
          ) : (
            <SecenekSatiri
              baslik="Gizli oylama"
              aciklama="Cihaz elden ele dolaşır, kimse kimin oyunu görmez"
              acik={ayarlar.gizliOylama}
              onDegis={(v) => setAyarlar((a) => ({ ...a, gizliOylama: v }))}
            />
          )}
          <SecenekSatiri
            baslik="Ses ve titreşim"
            aciklama="Gece, şafak, zafer ve süre uyarıları; titreşim Android'de çalışır"
            acik={ayarlar.sesEfektleri}
            onDegis={(v) => setAyarlar((a) => ({ ...a, sesEfektleri: v }))}
          />
          <SecenekSatiri
            baslik="Ölenlerin kimliği açıklansın"
            aciklama="Kapalıyken sürgün edilen ya da öldürülen kişinin rolü gizli kalır — vampirler için daha kolay, köy için daha zor"
            acik={ayarlar.olulerinRoluAcik}
            onDegis={(v) => setAyarlar((a) => ({ ...a, olulerinRoluAcik: v }))}
          />
          <SecenekSatiri
            baslik="Doktor üst üste aynı kişiyi koruyabilir"
            aciklama="Kapalıyken önceki gece korunan kişi tekrar seçilemez"
            acik={ayarlar.doktorArtArdaAyniKisi}
            onDegis={(v) => setAyarlar((a) => ({ ...a, doktorArtArdaAyniKisi: v }))}
          />
        </div>
      </Panel>

      <Buton
        tamGenislik
        disabled={!!hata}
        onClick={() => {
          // Ad alanı boş bırakılmışsa (moderatör var ama isim girilmemiş) makul bir varsayılan kullan.
          const nihaiAyarlar: Ayarlar = {
            ...ayarlar,
            moderatorAdi: moderatorluAcik ? ayarlar.moderatorAdi?.trim() || "Moderatör" : null,
          };
          onBasla(isimler, dagilim, nihaiAyarlar, fotolar);
        }}
      >
        {moderatorluAcik ? "🎭 Kadroyu oluştur" : "🎬 Rolleri dağıt"}
      </Buton>
    </div>
  );
}

function SecenekSatiri({
  baslik,
  aciklama,
  acik,
  onDegis,
}: {
  baslik: string;
  aciklama: string;
  acik: boolean;
  onDegis: (deger: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={acik}
      onClick={() => onDegis(!acik)}
      className="flex w-full items-center justify-between gap-4 rounded-xl bg-black/20 px-3 py-2 text-left"
    >
      <span>
        <span className="block text-sm font-semibold text-white">{baslik}</span>
        <span className="block text-xs text-white/55">{aciklama}</span>
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          acik ? "bg-amber-300" : "bg-white/20"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
            acik ? "left-[1.375rem]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
