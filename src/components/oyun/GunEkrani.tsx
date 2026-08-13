"use client";

import { useEffect, useState } from "react";
import {
  ROLLER,
  hayattaOlanlar,
  oyuncuBul,
  type OyunDurumu,
} from "@/lib/oyun/vampirKoylu";
import { sesCal, titret } from "@/lib/oyun/sesler";
import { MasaGorunumu } from "./MasaGorunumu";
import { Baslik, Buton, Panel } from "./ui";
import { VedaEkrani, VedaKarti } from "./VedaEkrani";

interface GunEkraniProps {
  durum: OyunDurumu;
  onSafagiGec: () => void;
  onTartismayaGec: () => void;
  onTartismayiBitir: () => void;
  onOyVer: (hedefId: number | null) => void;
  onSonucuOnayla: () => void;
  /**
   * Veda akışı opsiyoneldir: yalnızca sağlanırsa "veda mesajı iste" butonu
   * gösterilir. Ağ üzerinden oyunda (herkesin aynı anda gördüğü ekranda,
   * tek bir "sırası gelen" kişi olmadan) bu üçü verilmez, buton çıkmaz.
   */
  onVedaBaslat?: (oyuncuId: number) => void;
  onVedaKaydet?: (gifUrl: string, gifId: string, kelime: string | null) => void;
  onVedaAtla?: () => void;
  /**
   * Pratik çözüm: oyunun ortasında bir hata/yanlış anlaşılma yüzünden masayı
   * baştan almak istendiğinde, tam sıfırlamaya (kurulumu yeniden doldurmaya)
   * ya da eli hızlıca bitirmeye çalışmak yerine — aynı isimler/dağılım/ayarlarla
   * yeni bir kura çekip doğrudan dağıtıma döner. Yalnızca sağlanırsa gösterilir.
   */
  onTekrarBasla?: () => void;
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
function SafakBolumu({
  durum,
  onSafagiGec,
  onTartismayaGec,
  onVedaBaslat,
  onVedaKaydet,
  onVedaAtla,
  onTekrarBasla,
}: GunEkraniProps) {
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
        {onTekrarBasla && (
          <Buton
            tamGenislik
            ton="hayalet"
            onClick={() => {
              if (window.confirm("Masa aynı isim/dağılım/ayarlarla baştan alınsın mı? Bu oyundaki ilerleme silinecek.")) {
                onTekrarBasla();
              }
            }}
          >
            🔁 Tekrar başla
          </Buton>
        )}
      </div>
    );
  }

  const olen = oyuncuBul(durum.oyuncular, durum.safakOlen);

  // Cihaz şu an ölen oyuncuda, veda mesajı yazıyor: masaya döndürene kadar
  // tüm ekranı bu devralır (aynı gizlilik kapısı gece devrindeki gibi).
  if (olen && onVedaKaydet && onVedaAtla && durum.vedaYazan === olen.id) {
    return <VedaEkrani oyuncu={olen} onKaydet={onVedaKaydet} onAtla={onVedaAtla} />;
  }

  return (
    <div className="space-y-5">
      <Baslik
        ustBaslik={`${durum.gun}. gün`}
        baslik={olen ? `${olen.ad} öldürüldü` : "Kimse ölmedi"}
        aciklama={
          olen
            ? durum.ayarlar.olulerinRoluAcik
              ? `Kimliği: ${ROLLER[olen.rol].emoji} ${ROLLER[olen.rol].ad}. Artık konuşamaz ve oy kullanamaz.`
              : "Kimliği açıklanmıyor. Artık konuşamaz ve oy kullanamaz."
            : "Vampirler eli boş döndü ya da doktor tam zamanında yetişti."
        }
      />
      <MasaGorunumu
        oyuncular={durum.oyuncular}
        oluRolleriGoster={durum.ayarlar.olulerinRoluAcik}
        merkez={
          <div className="space-y-1">
            <p className="text-4xl" aria-hidden>
              {olen ? "⚰️" : "🕊️"}
            </p>
            <p className="text-sm font-bold text-white">{olen ? olen.ad : "Sakin bir gece"}</p>
          </div>
        }
      />

      {olen?.veda && <VedaKarti veda={olen.veda} />}

      {olen && !olen.vedaSorulduMu && onVedaBaslat && (
        <Buton tamGenislik ton="ikincil" onClick={() => onVedaBaslat(olen.id)}>
          💌 Veda mesajını iste
        </Buton>
      )}

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
  // Süre duvar saatine göre işler (bitis: hedef zaman damgası, null: duraklatıldı).
  // Böylece ekran kilitliyken setInterval dursa bile, kilit açılınca sayaç
  // gerçekte geçen süreyi gösterir.
  const [bitis, setBitis] = useState<number | null>(() => Date.now() + durum.ayarlar.tartismaSuresi * 1000);
  const calisiyor = bitis !== null;

  useEffect(() => {
    if (bitis === null) return;
    let onceki = Math.max(0, Math.ceil((bitis - Date.now()) / 1000));
    const guncelle = () => {
      const yeni = Math.max(0, Math.ceil((bitis - Date.now()) / 1000));
      if (yeni !== onceki) {
        if (yeni === 0) {
          sesCal("sureDoldu");
          titret([120, 80, 120, 80, 250]);
        } else if (yeni <= 10) {
          sesCal("tik");
        }
        onceki = yeni;
      }
      setKalan(yeni);
    };
    const id = setInterval(guncelle, 1000);
    // Kilitten/arka plandan dönüşte tik beklemeden anında düzelt.
    document.addEventListener("visibilitychange", guncelle);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", guncelle);
    };
  }, [bitis]);

  function duraklatDevamEt() {
    if (calisiyor) setBitis(null);
    else if (kalan > 0) setBitis(Date.now() + kalan * 1000);
  }

  function otuzSaniyeEkle() {
    setKalan((v) => v + 30);
    setBitis((b) => (b === null ? null : b + 30_000));
  }

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
        oluRolleriGoster={durum.ayarlar.olulerinRoluAcik}
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
        <Buton ton="ikincil" onClick={duraklatDevamEt} disabled={sureDoldu}>
          {calisiyor ? "⏸ Duraklat" : "▶️ Devam"}
        </Buton>
        <Buton ton="ikincil" onClick={otuzSaniyeEkle}>
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

  // Masada kimin sırası olduğu karışmasın: koltuk numarası + önceki oy veren
  // her iki ekranda da gösteriliyor, oy verenin koltuğu 🗳️ ile işaretli.
  const koltukNo = durum.oyuncular.findIndex((o) => o.id === oyVeren.id) + 1;
  const onceki = durum.oySira > 0 ? hayatta[durum.oySira - 1] : null;

  // Açık oylamada o ana kadarki oylar masada görünür.
  const rozetler: Record<number, string> = {};
  if (!gizli) {
    const sayac = new Map<number, number>();
    Object.values(durum.oylar).forEach((hedef) => {
      if (hedef === null || hedef === undefined) return;
      sayac.set(hedef, (sayac.get(hedef) ?? 0) + 1);
    });
    sayac.forEach((adet, id) => {
      rozetler[id] = `${adet} oy`;
    });
  }
  rozetler[oyVeren.id] = rozetler[oyVeren.id] ? `🗳️ ${rozetler[oyVeren.id]}` : "🗳️ oy sırası";

  if (!devralindi) {
    return (
      <div className="space-y-6">
        <Baslik
          ustBaslik={`Gizli oylama · ${durum.oySira + 1}/${hayatta.length}`}
          baslik={`${koltukNo}. koltuk · ${oyVeren.ad}`}
          aciklama={
            <>
              {onceki ? `${onceki.ad} oyunu verdi; sıra sende.` : "İlk oy sende."} Cihazı elinde
              tutan <strong className="text-white">{oyVeren.ad}</strong> değilse, önce ona uzatın.
            </>
          }
        />
        <div className="flex justify-center py-8 text-7xl">🗳️</div>
        <Buton tamGenislik onClick={() => setDevralindi(true)}>
          Ben {oyVeren.ad} — oy vereceğim
        </Buton>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Baslik
        ustBaslik={`${gizli ? "Gizli" : "Açık"} oylama · ${durum.oySira + 1}/${hayatta.length}`}
        baslik={`${oyVeren.ad} kime oy veriyor?`}
        aciklama={`${koltukNo}. koltuktasın. Sürgün edilmesini istediğin kişiye dokun; kararsızsan çekimser kal.`}
      />

      <MasaGorunumu
        oyuncular={durum.oyuncular}
        oluRolleriGoster={durum.ayarlar.olulerinRoluAcik}
        secilebilirIdler={hayatta.filter((o) => o.id !== oyVeren.id).map((o) => o.id)}
        seciliId={secim}
        onSec={setSecim}
        rozetler={rozetler}
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

function OylamaSonucBolumu({
  durum,
  onSonucuOnayla,
  onVedaBaslat,
  onVedaKaydet,
  onVedaAtla,
}: GunEkraniProps) {
  const sonuc = durum.oylamaSonucu;
  const [acildi, setAcildi] = useState(false);
  if (!sonuc) return null;

  const hedef = oyuncuBul(durum.oyuncular, sonuc.infazEdilen);

  if (hedef && onVedaKaydet && onVedaAtla && durum.vedaYazan === hedef.id) {
    return <VedaEkrani oyuncu={hedef} onKaydet={onVedaKaydet} onAtla={onVedaAtla} />;
  }

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
            ? durum.ayarlar.olulerinRoluAcik
              ? `Gerçek kimliği: ${ROLLER[hedef.rol].emoji} ${ROLLER[hedef.rol].ad}`
              : "Kimliği açıklanmıyor — köy doğru kişiyi mi astı, bilmiyor."
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

      {hedef?.veda && <VedaKarti veda={hedef.veda} />}

      {hedef && !hedef.vedaSorulduMu && onVedaBaslat && (
        <Buton tamGenislik ton="ikincil" onClick={() => onVedaBaslat(hedef.id)}>
          💌 Veda mesajını iste
        </Buton>
      )}

      {/* Sürgün oyunu bitirebilir (Soytarı, teslim kuralı); "geceye geç" deme. */}
      <Buton tamGenislik onClick={onSonucuOnayla}>
        ➡️ Devam et
      </Buton>
    </div>
  );
}
