"use client";

import { useMemo, useState } from "react";
import {
  MAKS_OYUNCU,
  MIN_OYUNCU,
  ROLLER,
  VARSAYILAN_AYARLAR,
  dagilimToplami,
  varsayilanDagilim,
  type Ayarlar,
  type RolId,
} from "@/lib/oyun/vampirKoylu";
import { Baslik, Buton, Panel } from "./ui";

const ROL_SIRASI: RolId[] = ["vampir", "doktor", "gozcu", "koylu"];
const VARSAYILAN_OYUNCU = 6;

interface KurulumEkraniProps {
  onBasla: (isimler: string[], dagilim: Record<RolId, number>, ayarlar: Ayarlar) => void;
}

export function KurulumEkrani({ onBasla }: KurulumEkraniProps) {
  const [isimler, setIsimler] = useState<string[]>(() =>
    Array.from({ length: VARSAYILAN_OYUNCU }, (_, i) => `Oyuncu ${i + 1}`),
  );
  const [dagilim, setDagilim] = useState<Record<RolId, number>>(() =>
    varsayilanDagilim(VARSAYILAN_OYUNCU),
  );
  const [ayarlar, setAyarlar] = useState<Ayarlar>(VARSAYILAN_AYARLAR);

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
    setDagilim(varsayilanDagilim(sinirli));
  }

  function rolAdediniDegistir(rol: RolId, fark: number) {
    setDagilim((onceki) => ({ ...onceki, [rol]: Math.max(0, onceki[rol] + fark) }));
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

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {isimler.map((isim, i) => (
            <label key={i} className="flex min-h-11 items-center gap-2 rounded-xl bg-black/20 px-3 py-2">
              <span className="w-6 shrink-0 text-center text-xs font-bold text-amber-300/80">
                {i + 1}
              </span>
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
            </label>
          ))}
        </div>
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

          <SecenekSatiri
            baslik="Gizli oylama"
            aciklama="Cihaz elden ele dolaşır, kimse kimin oyunu görmez"
            acik={ayarlar.gizliOylama}
            onDegis={(v) => setAyarlar((a) => ({ ...a, gizliOylama: v }))}
          />
          <SecenekSatiri
            baslik="Doktor üst üste aynı kişiyi koruyabilir"
            aciklama="Kapalıyken önceki gece korunan kişi tekrar seçilemez"
            acik={ayarlar.doktorArtArdaAyniKisi}
            onDegis={(v) => setAyarlar((a) => ({ ...a, doktorArtArdaAyniKisi: v }))}
          />
        </div>
      </Panel>

      <Buton tamGenislik disabled={!!hata} onClick={() => onBasla(isimler, dagilim, ayarlar)}>
        🎬 Rolleri dağıt
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
