"use client";

import { useEffect, useState } from "react";
import {
  ROLLER,
  hayattaOlanlar,
  oyuncuBul,
  type OyunDurumu,
} from "@/lib/oyun/vampirKoylu";
import { MasaGorunumu } from "./MasaGorunumu";
import { Baslik, Buton, Panel } from "./ui";

interface GunEkraniProps {
  durum: OyunDurumu;
  onSafagiGec: () => void;
  onTartismayaGec: () => void;
  onTartismayiBitir: () => void;
  onOyVer: (hedefId: number | null) => void;
  onSonucuOnayla: () => void;
}

export function GunEkrani(props: GunEkraniProps) {
  const { durum } = props;
  if (durum.asama === "safak") return <SafakBolumu {...props} />;
  if (durum.asama === "tartisma") return <TartismaBolumu {...props} />;
  // Her oy sırasında bileşen sıfırdan kurulur: önceki oyuncunun seçimi ekranda kalmaz.
  if (durum.asama === "oylama") return <OylamaBolumu key={durum.oySira} {...props} />;
  if (durum.asama === "oylama-sonuc") return <OylamaSonucBolumu {...props} />;
  return null;
}

/** Gece bitti: önce herkes uyanır, sonra sonuç açıklanır. */
function SafakBolumu({ durum, onSafagiGec, onTartismayaGec }: GunEkraniProps) {
  if (!durum.safakAcildi) {
    return (
      <div className="space-y-6">
        <Baslik
          ustBaslik={`${durum.gun}. gün`}
          baslik="Güneş doğuyor"
          aciklama="Herkes gözlerini açsın. Gecenin sonucunu duyurmak için dokun."
        />
        <div className="flex justify-center py-8 text-7xl">🌅</div>
        <Buton tamGenislik onClick={onSafagiGec}>
          ☀️ Köyü uyandır
        </Buton>
      </div>
    );
  }

  const olen = oyuncuBul(durum.oyuncular, durum.safakOlen);

  return (
    <div className="space-y-5">
      <Baslik
        ustBaslik={`${durum.gun}. gün`}
        baslik={olen ? `${olen.ad} öldürüldü` : "Kimse ölmedi"}
        aciklama={
          olen
            ? `Kimliği: ${ROLLER[olen.rol].emoji} ${ROLLER[olen.rol].ad}. Artık konuşamaz ve oy kullanamaz.`
            : "Vampirler eli boş döndü ya da doktor tam zamanında yetişti."
        }
      />
      <MasaGorunumu
        oyuncular={durum.oyuncular}
        merkez={
          <div className="space-y-1">
            <p className="text-4xl" aria-hidden>
              {olen ? "⚰️" : "🕊️"}
            </p>
            <p className="text-sm font-bold text-white">{olen ? olen.ad : "Sakin bir gece"}</p>
          </div>
        }
      />
      <Buton tamGenislik onClick={onTartismayaGec}>
        🗣️ Tartışmayı başlat
      </Buton>
    </div>
  );
}

function sureBicimle(saniye: number) {
  const dk = Math.floor(saniye / 60);
  const sn = saniye % 60;
  return `${dk}:${String(sn).padStart(2, "0")}`;
}

function TartismaBolumu({ durum, onTartismayiBitir }: GunEkraniProps) {
  const [kalan, setKalan] = useState(durum.ayarlar.tartismaSuresi);
  const [calisiyor, setCalisiyor] = useState(true);

  useEffect(() => {
    if (!calisiyor) return;
    const id = setInterval(() => {
      setKalan((onceki) => (onceki <= 1 ? 0 : onceki - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [calisiyor]);

  const sureDoldu = kalan === 0;
  const hayatta = hayattaOlanlar(durum.oyuncular);

  // Telefonda oylama butonu kaydırmadan görünsün diye bu ekran bilinçli olarak
  // sade ve sıkı tutuldu: kim hayatta bilgisi zaten masada (ölüler 💀 ile işaretli).
  return (
    <div className="space-y-4">
      <Baslik
        ustBaslik={`${durum.gun}. gün · ${hayatta.length} kişi hayatta`}
        baslik="Kim şüpheli?"
        aciklama="Sırayla konuşun, savunun, çelişkileri yakalayın."
      />

      <MasaGorunumu
        oyuncular={durum.oyuncular}
        merkez={
          <div className="space-y-1">
            <p
              className={`text-4xl font-black tabular-nums ${
                sureDoldu ? "text-red-300" : kalan <= 30 ? "text-amber-300" : "text-white"
              }`}
            >
              {sureBicimle(kalan)}
            </p>
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/50">
              {sureDoldu ? "süre doldu" : calisiyor ? "tartışma sürüyor" : "duraklatıldı"}
            </p>
          </div>
        }
      />

      <div className="flex flex-wrap justify-center gap-2">
        <Buton ton="ikincil" onClick={() => setCalisiyor((v) => !v)} disabled={sureDoldu}>
          {calisiyor ? "⏸ Duraklat" : "▶️ Devam"}
        </Buton>
        <Buton ton="ikincil" onClick={() => setKalan((v) => v + 30)}>
          +30 sn
        </Buton>
      </div>

      <Buton tamGenislik onClick={onTartismayiBitir}>
        🗳️ Oylamaya geç
      </Buton>
    </div>
  );
}

function OylamaBolumu({ durum, onOyVer }: GunEkraniProps) {
  const hayatta = hayattaOlanlar(durum.oyuncular);
  const oyVeren = hayatta[durum.oySira];
  const gizli = durum.ayarlar.gizliOylama;
  // Açık oylamada cihaz devri adımı yoktur, doğrudan seçime geçilir.
  const [devralindi, setDevralindi] = useState(!gizli);
  const [secim, setSecim] = useState<number | null>(null);

  if (!oyVeren) return null;

  // Açık oylamada o ana kadarki oylar masada görünür.
  const acikSayim: Record<number, string> = {};
  if (!gizli) {
    const sayac = new Map<number, number>();
    Object.values(durum.oylar).forEach((hedef) => {
      if (hedef === null || hedef === undefined) return;
      sayac.set(hedef, (sayac.get(hedef) ?? 0) + 1);
    });
    sayac.forEach((adet, id) => {
      acikSayim[id] = `${adet} oy`;
    });
  }

  if (!devralindi) {
    return (
      <div className="space-y-6">
        <Baslik
          ustBaslik={`Gizli oylama · ${durum.oySira + 1}/${hayatta.length}`}
          baslik={`Cihaz ${oyVeren.ad}'de`}
          aciklama="Oyun gizli. Cihazı al, kimsenin görmediğinden emin ol ve oyunu ver."
        />
        <div className="flex justify-center py-8 text-7xl">🗳️</div>
        <Buton tamGenislik onClick={() => setDevralindi(true)}>
          Oyumu vereceğim
        </Buton>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Baslik
        ustBaslik={`${gizli ? "Gizli" : "Açık"} oylama · ${durum.oySira + 1}/${hayatta.length}`}
        baslik={`${oyVeren.ad} kime oy veriyor?`}
        aciklama="Sürgün edilmesini istediğin kişiye dokun. Kararsızsan çekimser kalabilirsin."
      />

      <MasaGorunumu
        oyuncular={durum.oyuncular}
        secilebilirIdler={hayatta.filter((o) => o.id !== oyVeren.id).map((o) => o.id)}
        seciliId={secim}
        onSec={setSecim}
        rozetler={acikSayim}
        merkez={
          <div className="space-y-1">
            <p className="text-4xl" aria-hidden>
              ⚖️
            </p>
            <p className="text-sm font-bold text-white">
              {secim === null ? "Bir koltuğa dokun" : oyuncuBul(durum.oyuncular, secim)?.ad}
            </p>
          </div>
        }
      />

      <div className="flex flex-wrap justify-center gap-2">
        <Buton ton="hayalet" onClick={() => onOyVer(null)}>
          🙅 Çekimser
        </Buton>
        <Buton disabled={secim === null} onClick={() => onOyVer(secim)}>
          ✅ Oyumu ver
        </Buton>
      </div>
    </div>
  );
}

function OylamaSonucBolumu({ durum, onSonucuOnayla }: GunEkraniProps) {
  const sonuc = durum.oylamaSonucu;
  const [acildi, setAcildi] = useState(false);
  if (!sonuc) return null;

  const hedef = oyuncuBul(durum.oyuncular, sonuc.infazEdilen);

  if (!acildi) {
    return (
      <div className="space-y-6">
        <Baslik
          ustBaslik={`${durum.gun}. gün`}
          baslik="Oylar sayıldı"
          aciklama="Sonucu açıklamak için dokun."
        />
        <div className="flex justify-center py-8 text-7xl">📜</div>
        <Buton tamGenislik onClick={() => setAcildi(true)}>
          Sonucu aç
        </Buton>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Baslik
        ustBaslik={`${durum.gun}. gün · karar`}
        baslik={hedef ? `${hedef.ad} sürgün edildi` : "Kimse sürgün edilmedi"}
        aciklama={
          hedef
            ? `Gerçek kimliği: ${ROLLER[hedef.rol].emoji} ${ROLLER[hedef.rol].ad}`
            : sonuc.berabere
              ? "Oylar başa baş bitti; köy karar veremedi."
              : "Herkes çekimser kaldı."
        }
      />

      <Panel>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/50">Oy dökümü</p>
        <ul className="space-y-1.5">
          {sonuc.sayim.map(([id, adet]) => {
            const oyuncu = oyuncuBul(durum.oyuncular, id);
            const enYuksek = adet === sonuc.sayim[0][1];
            return (
              <li key={id} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-sm font-semibold text-white">
                  {oyuncu?.ad}
                </span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <span
                    className={`block h-full rounded-full ${enYuksek ? "bg-amber-300" : "bg-white/40"}`}
                    style={{ width: `${(adet / sonuc.sayim[0][1]) * 100}%` }}
                  />
                </span>
                <span className="w-6 text-right text-sm font-bold text-white/80">{adet}</span>
              </li>
            );
          })}
          {sonuc.cekimser > 0 && (
            <li className="pt-1 text-xs text-white/50">Çekimser: {sonuc.cekimser}</li>
          )}
        </ul>
      </Panel>

      <Buton tamGenislik onClick={onSonucuOnayla}>
        🌙 Geceye geç
      </Buton>
    </div>
  );
}
