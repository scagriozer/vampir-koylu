"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  MIN_OYUNCU,
  ROLLER,
  dagilimToplami,
  varsayilanDagilim,
  type Ayarlar,
  type RolId,
} from "@/lib/oyun/vampirKoylu";
import { fotografiKareJpegYap } from "@/lib/oyun/foto";
import type { OdaOyuncusu } from "@/lib/ag/protokol";
import { Baslik, Buton, Panel } from "../oyun/ui";

const ROL_SIRASI: RolId[] = ["vampir", "doktor", "gozcu", "koylu", "soytari", "sagkalan"];

function FotoSecici({ foto, onSec }: { foto: string | null; onSec: (v: string | null) => void }) {
  const girdiRef = useRef<HTMLInputElement>(null);
  async function degisti(e: ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    e.target.value = "";
    if (!dosya) return;
    try {
      onSec(await fotografiKareJpegYap(dosya));
    } catch {
      // yoksay
    }
  }
  return (
    <button
      type="button"
      onClick={() => girdiRef.current?.click()}
      className="relative mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/[0.06] text-2xl"
      aria-label={foto ? "Fotoğrafını değiştir" : "Fotoğraf ekle (opsiyonel)"}
    >
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element -- statik export, data URL
        <img src={foto} alt="" className="h-full w-full object-cover" />
      ) : (
        "📷"
      )}
      <input ref={girdiRef} type="file" accept="image/*" className="hidden" onChange={degisti} />
    </button>
  );
}

/** Oda kur ya da mevcut bir odaya katıl: isim + opsiyonel fotoğraf her iki yolda da istenir. */
export function GirisEkrani({
  onOlustur,
  onKatil,
  hata,
}: {
  onOlustur: (ad: string, foto: string | null) => void;
  onKatil: (kod: string, ad: string, foto: string | null) => void;
  hata: string | null;
}) {
  const [sekme, setSekme] = useState<"kur" | "katil">("kur");
  const [ad, setAd] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [kod, setKod] = useState("");

  const adGecerli = ad.trim().length > 0;
  const gonderilebilir = sekme === "kur" ? adGecerli : adGecerli && kod.trim().length === 5;

  return (
    <div className="space-y-6">
      <Baslik
        ustBaslik="Ağ üzerinden · beta"
        baslik="Kendi telefonunla oyna"
        aciklama="Her oyuncu kendi cihazında oynar; roller yalnızca kendi ekranında görünür."
      />

      <Panel>
        <div className="flex gap-2 rounded-xl bg-black/20 p-1">
          <button
            type="button"
            onClick={() => setSekme("kur")}
            className={`min-h-11 flex-1 rounded-lg text-sm font-bold transition-colors ${
              sekme === "kur" ? "bg-amber-300 text-[#1a1208]" : "text-white/60"
            }`}
          >
            Oda kur
          </button>
          <button
            type="button"
            onClick={() => setSekme("katil")}
            className={`min-h-11 flex-1 rounded-lg text-sm font-bold transition-colors ${
              sekme === "katil" ? "bg-amber-300 text-[#1a1208]" : "text-white/60"
            }`}
          >
            Odaya katıl
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <FotoSecici foto={foto} onSec={setFoto} />
          <label className="flex min-h-11 items-center gap-2 rounded-xl bg-black/20 px-3 py-2">
            <input
              value={ad}
              maxLength={18}
              onChange={(e) => setAd(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full bg-transparent text-center text-base font-semibold text-white outline-none placeholder:text-white/30"
              placeholder="Adın"
              aria-label="Adın"
            />
          </label>

          {sekme === "katil" && (
            <label className="flex min-h-11 items-center gap-2 rounded-xl bg-black/20 px-3 py-2">
              <input
                value={kod}
                maxLength={5}
                onChange={(e) => setKod(e.target.value.toUpperCase())}
                className="w-full bg-transparent text-center text-lg font-black uppercase tracking-[0.3em] text-white outline-none placeholder:text-white/30 placeholder:tracking-normal placeholder:text-base placeholder:font-semibold"
                placeholder="Oda kodu"
                aria-label="Oda kodu"
              />
            </label>
          )}
        </div>
      </Panel>

      {hata && (
        <Panel className="!border-red-400/30 !bg-red-500/10">
          <p className="text-center text-sm text-red-200">{hata}</p>
        </Panel>
      )}

      <Buton
        tamGenislik
        disabled={!gonderilebilir}
        onClick={() =>
          sekme === "kur" ? onOlustur(ad, foto) : onKatil(kod, ad, foto)
        }
      >
        {sekme === "kur" ? "🎲 Oda kur" : "🚪 Odaya katıl"}
      </Buton>
    </div>
  );
}

/** Bekleme odası: kim katıldı, host içinse rol dağılımı + ayarlar + başlat. */
export function LobiEkrani({
  odaKodu,
  oyuncular,
  hostMu,
  dagilim,
  setDagilim,
  ayarlar,
  setAyarlar,
  onBaslat,
  baslatilabilirDegilNeden,
}: {
  odaKodu: string;
  oyuncular: OdaOyuncusu[];
  hostMu: boolean;
  dagilim: Record<RolId, number>;
  setDagilim: (v: Record<RolId, number>) => void;
  ayarlar: Ayarlar;
  setAyarlar: (v: Ayarlar) => void;
  onBaslat: () => void;
  baslatilabilirDegilNeden: string | null;
}) {
  const toplam = dagilimToplami(dagilim);
  const oyuncuSayisi = oyuncular.length;

  function rolAdediniDegistir(rol: RolId, fark: number) {
    setDagilim({ ...dagilim, [rol]: Math.max(0, dagilim[rol] + fark) });
  }

  return (
    <div className="space-y-6">
      <Baslik ustBaslik="Oda hazır" baslik="Bekleme odası" />

      <Panel className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-white/50">Oda kodu · paylaş</p>
        <p className="mt-1 text-4xl font-black tracking-[0.3em] text-amber-300">{odaKodu}</p>
      </Panel>

      <Panel>
        <p className="text-sm font-bold text-white">Katılanlar · {oyuncuSayisi}</p>
        <ul className="mt-3 space-y-2">
          {oyuncular.map((o) => (
            <li key={o.cihazId} className="flex items-center gap-3 rounded-xl bg-black/20 px-3 py-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.06] text-lg">
                {o.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element -- statik export, data URL
                  <img src={o.foto} alt="" className="h-full w-full object-cover" />
                ) : (
                  "🙂"
                )}
              </span>
              <span className="text-sm font-semibold text-white">{o.ad}</span>
            </li>
          ))}
        </ul>
      </Panel>

      {hostMu ? (
        <>
          <Panel>
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-bold text-white">Rol dağılımı</p>
              <button
                type="button"
                onClick={() => setDagilim(varsayilanDagilim(Math.max(MIN_OYUNCU, oyuncuSayisi)))}
                className="-my-3 -mr-2 inline-flex min-h-11 items-center px-2 text-xs font-semibold text-amber-300 underline-offset-2 hover:underline"
              >
                Katılan sayısına göre öner
              </button>
            </div>
            <ul className="mt-3 space-y-2">
              {ROL_SIRASI.map((rolId) => {
                const rol = ROLLER[rolId];
                return (
                  <li key={rolId} className="flex items-center gap-3 rounded-xl bg-black/20 px-3 py-2">
                    <span className="text-xl" aria-hidden>
                      {rol.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white">{rol.ad}</p>
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
                      <span className="w-5 text-center text-base font-black text-white">{dagilim[rolId]}</span>
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
            <p className="mt-3 text-center text-xs font-semibold text-white/60">
              Toplam {toplam} rol · {oyuncuSayisi} katılımcı
            </p>
          </Panel>

          <Panel>
            <p className="text-sm font-bold text-white">Oyun ayarları</p>
            <div className="mt-3 flex items-center justify-between gap-4 rounded-xl bg-black/20 px-3 py-2">
              <p className="text-sm font-semibold text-white">Tartışma süresi</p>
              <select
                value={ayarlar.tartismaSuresi}
                onChange={(e) => setAyarlar({ ...ayarlar, tartismaSuresi: Number(e.target.value) })}
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
          </Panel>

          <Buton tamGenislik disabled={!!baslatilabilirDegilNeden} onClick={onBaslat}>
            🎬 Oyunu başlat
          </Buton>
          {baslatilabilirDegilNeden && (
            <p className="text-center text-xs font-semibold text-red-300">{baslatilabilirDegilNeden}</p>
          )}
        </>
      ) : (
        <Panel className="!py-6 text-center">
          <p className="text-sm text-white/70">Oda kurucusunun oyunu başlatmasını bekliyorsun…</p>
        </Panel>
      )}
    </div>
  );
}
