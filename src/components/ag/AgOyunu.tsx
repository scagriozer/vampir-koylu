"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  MAKS_OYUNCU,
  MIN_OYUNCU,
  VARSAYILAN_AYARLAR,
  baslangicDurumu,
  dagilimToplami,
  geceSirasindaki,
  hayattaOlanlar,
  oyunReducer,
  varsayilanDagilim,
  type Ayarlar,
  type OyunAksiyonu,
  type OyunDurumu,
  type RolId,
} from "@/lib/oyun/vampirKoylu";
import { bosSkorTablosu, gecerliSkorMu, oyunuIsle, type SkorTablosu } from "@/lib/oyun/skor";
import { klipCal, sesAyarla, sesCal, titret } from "@/lib/oyun/sesler";
import { agModuKullanilabilirMi, supabaseIstemcisi } from "@/lib/ag/supabase";
import {
  cihazKimligiUret,
  kanalAdi,
  odaKoduUret,
  type CihazId,
  type HostMesaji,
  type IstemciMesaji,
  type OdaOyuncusu,
} from "@/lib/ag/protokol";
import { AgBekleme } from "./AgBekleme";
import { GirisEkrani, LobiEkrani } from "./AgLobisi";
import { RolKarti } from "./RolKarti";
import { BitisEkrani } from "../oyun/BitisEkrani";
import { GeceEkrani } from "../oyun/GeceEkrani";
import { GunEkrani } from "../oyun/GunEkrani";
import { KurallarModal } from "../oyun/KurallarModal";
import { Buton } from "../oyun/ui";

const SKOR_ANAHTARI = "vampir-koylu-ag-skor";
const CIHAZ_ID_ANAHTARI = "vampir-koylu-ag-cihaz-id";
// Ağ oyununda hiçbir zaman fiziksel el değiştirme olmadığı için gizli oylama
// kavramı anlamsızdır; her zaman açık (senkronize) oylama yürütülür.
const AG_AYARLARI_TABANI: Ayarlar = { ...VARSAYILAN_AYARLAR, gizliOylama: false, moderatorAdi: null };

function skorOku(): SkorTablosu {
  try {
    const ham = window.localStorage.getItem(SKOR_ANAHTARI);
    if (ham) {
      const veri: unknown = JSON.parse(ham);
      if (gecerliSkorMu(veri)) return veri;
    }
  } catch {
    // yoksay
  }
  return bosSkorTablosu();
}

function cihazIdOku(): CihazId {
  try {
    const mevcut = window.sessionStorage.getItem(CIHAZ_ID_ANAHTARI);
    if (mevcut) return mevcut;
  } catch {
    // depolama kapalıysa oturum boyunca bellekte üretilen kimlik yeter
  }
  const yeni = cihazKimligiUret();
  try {
    window.sessionStorage.setItem(CIHAZ_ID_ANAHTARI, yeni);
  } catch {
    // yoksay
  }
  return yeni;
}

type AgAsama = "giris" | "lobi" | "oyun";

/** Lobide "Oyunu başlat" etkinleştirilebilir mi? Değilse sebebi, öyleyse null. */
function baslatmaEngeli(oyuncular: OdaOyuncusu[], dagilim: Record<RolId, number>): string | null {
  const sayisi = oyuncular.length;
  if (sayisi < MIN_OYUNCU) return `En az ${MIN_OYUNCU} oyuncu gerekli.`;
  if (sayisi > MAKS_OYUNCU) return `En fazla ${MAKS_OYUNCU} oyuncu olabilir.`;
  if (dagilimToplami(dagilim) !== sayisi) return "Rol dağılımı katılımcı sayısına eşit olmalı.";
  if (dagilim.vampir < 1) return "En az 1 vampir olmalı.";
  if (dagilim.vampir >= sayisi - dagilim.vampir)
    return "Vampirler köylülerden az olmalı, yoksa oyun ilk gece biter.";
  return null;
}

/**
 * Ağ üzerinden oyun: her oyuncu kendi cihazında bağlanır, Supabase Realtime
 * broadcast kanalı üzerinden senkronize olur. Oda kurucusu (host) `oyunReducer`'ı
 * çalıştıran tek otorite kaynağıdır; diğer herkes aksiyonlarını host'a yollar,
 * host uygulayıp yeni durumu tüm odaya yayınlar. Sunucu kodu yok — Supabase'in
 * ücretsiz katmanı doğrudan istemciden kullanılıyor.
 */
export function AgOyunu({ onKapat }: { onKapat: () => void }) {
  const [cihazId] = useState(cihazIdOku);
  const [asama, setAsama] = useState<AgAsama>("giris");
  const [odaKodu, setOdaKodu] = useState("");
  const [hostMu, setHostMu] = useState(false);
  const [benim, setBenim] = useState<OdaOyuncusu | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  const [oyuncularLobi, setOyuncularLobi] = useState<OdaOyuncusu[]>([]);
  const [dagilim, setDagilim] = useState<Record<RolId, number>>(() => varsayilanDagilim(4));
  const [ayarlar, setAyarlar] = useState<Ayarlar>(AG_AYARLARI_TABANI);

  const [durum, setDurum] = useState<OyunDurumu | null>(null);
  const [kimlikler, setKimlikler] = useState<Record<CihazId, number>>({});
  const [rolGorulduOyunKimligi, setRolGorulduOyunKimligi] = useState<string | null>(null);
  const [kurallarAcik, setKurallarAcik] = useState(false);

  const [skorSurumu, setSkorSurumu] = useState(0);
  // skorSurumu bilinçli bağımlılık: sıfırlama sonrası localStorage'ı yeniden okutur.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const skor = useMemo(() => (durum ? oyunuIsle(skorOku(), durum) : bosSkorTablosu()), [durum, skorSurumu]);
  useEffect(() => {
    if (!durum) return;
    try {
      window.localStorage.setItem(SKOR_ANAHTARI, JSON.stringify(skor));
    } catch {
      // yoksay
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skor]);

  const kanalRef = useRef<RealtimeChannel | null>(null);
  const durumRef = useRef<OyunDurumu | null>(null);
  const hostMuRef = useRef(hostMu);
  const benimRef = useRef(benim);
  const kimliklerRef = useRef(kimlikler);
  useEffect(() => {
    hostMuRef.current = hostMu;
  }, [hostMu]);
  useEffect(() => {
    benimRef.current = benim;
  }, [benim]);
  useEffect(() => {
    kimliklerRef.current = kimlikler;
  }, [kimlikler]);

  function yayinDurum(d: OyunDurumu, k: Record<CihazId, number> = kimliklerRef.current) {
    const mesaj: HostMesaji = { tip: "durum", durum: d, kimlikler: k };
    kanalRef.current?.send({ type: "broadcast", event: "host", payload: mesaj });
  }

  function yayinLobi(oyuncular: OdaOyuncusu[]) {
    const mesaj: HostMesaji = { tip: "lobi", oyuncular };
    kanalRef.current?.send({ type: "broadcast", event: "host", payload: mesaj });
  }

  /** Host: bir aksiyonu motora uygular, sonucu yerelde tutar ve odaya yayınlar. */
  function hostAksiyonUygula(aksiyon: OyunAksiyonu) {
    if (!durumRef.current) return;
    let yeni = oyunReducer(durumRef.current, aksiyon);
    // Ağ modunda dağıtım aşaması hiç gösterilmez (rol her cihazda ayrı ayrı
    // görünür); ilk kurulumda da rövanşta da bu aşamayı anında atla.
    if (yeni.asama === "dagitim") yeni = oyunReducer(yeni, { tip: "dagitimiAtla" });
    durumRef.current = yeni;
    setDurum(yeni);
    yayinDurum(yeni);
  }

  /** Herkesin kullandığı tek dispatch: host'ta doğrudan uygular, istemcide host'a yollar. */
  function agDispatch(aksiyon: OyunAksiyonu) {
    if (hostMuRef.current) {
      hostAksiyonUygula(aksiyon);
      return;
    }
    const mesaj: IstemciMesaji = { tip: "aksiyon", cihazId, aksiyon };
    kanalRef.current?.send({ type: "broadcast", event: "istemci", payload: mesaj });
  }

  // — Kanal bağlantısı: odaKodu belirlenince kurulur, odadan çıkınca kapanır. —
  useEffect(() => {
    if (!odaKodu) return;
    const supabase = supabaseIstemcisi();
    const kanal = supabase.channel(kanalAdi(odaKodu), { config: { broadcast: { self: false } } });
    kanalRef.current = kanal;

    kanal.on("broadcast", { event: "istemci" }, ({ payload }) => {
      if (!hostMuRef.current) return; // yalnızca host, gelen istemci mesajlarını işler
      const mesaj = payload as IstemciMesaji;
      if (mesaj.tip === "katil") {
        setOyuncularLobi((onceki) => {
          if (onceki.some((o) => o.cihazId === mesaj.oyuncu.cihazId)) return onceki;
          const yeni = [...onceki, mesaj.oyuncu];
          yayinLobi(yeni);
          return yeni;
        });
      } else if (mesaj.tip === "aksiyon") {
        hostAksiyonUygula(mesaj.aksiyon);
      }
    });

    kanal.on("broadcast", { event: "host" }, ({ payload }) => {
      const mesaj = payload as HostMesaji;
      if (mesaj.tip === "lobi") {
        if (!hostMuRef.current) setOyuncularLobi(mesaj.oyuncular);
      } else if (mesaj.tip === "durum") {
        durumRef.current = mesaj.durum;
        setDurum(mesaj.durum);
        setKimlikler(mesaj.kimlikler);
        setAsama("oyun");
      }
    });

    kanal.subscribe((baglantiDurumu) => {
      if (baglantiDurumu === "SUBSCRIBED" && !hostMuRef.current && benimRef.current) {
        const mesaj: IstemciMesaji = { tip: "katil", oyuncu: benimRef.current };
        kanal.send({ type: "broadcast", event: "istemci", payload: mesaj });
      }
    });

    return () => {
      supabase.removeChannel(kanal);
      kanalRef.current = null;
    };
    // Kanal yalnızca odaKodu değişince yeniden kurulmalı; içeride kullanılan
    // fonksiyonlar ref'ler üzerinden güncel veriye erişiyor (bkz. hostMuRef,
    // benimRef, kimliklerRef), bu yüzden bağımlılık listesine eklenmiyorlar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [odaKodu]);

  // — Ses/titreşim: faz geçişlerinde efekt çal (tek cihazlı moddakiyle aynı mantık). —
  useEffect(() => {
    sesAyarla(ayarlar.sesEfektleri);
  }, [ayarlar.sesEfektleri]);
  const oncekiFazRef = useRef<{ asama: OyunDurumu["asama"]; safakAcildi: boolean } | null>(null);
  useEffect(() => {
    if (!durum) return;
    const onceki = oncekiFazRef.current;
    oncekiFazRef.current = { asama: durum.asama, safakAcildi: durum.safakAcildi };
    if (!onceki) return;
    if (durum.asama === "gece" && onceki.asama !== "gece") {
      sesCal("gece");
      titret([40, 80, 40]);
    }
    if (durum.asama === "safak" && durum.safakAcildi && !(onceki.asama === "safak" && onceki.safakAcildi)) {
      if (durum.safakOlen !== null) klipCal("essela", "olum");
      else klipCal("sasirma", "safak");
    }
    if (durum.asama === "bitis" && onceki.asama !== "bitis") {
      sesCal("zafer");
      titret([60, 60, 60, 60, 200]);
    }
  }, [durum]);

  function odaOlustur(ad: string, foto: string | null) {
    const b: OdaOyuncusu = { cihazId, ad: ad.trim(), foto };
    setBenim(b);
    setHostMu(true);
    setOyuncularLobi([b]);
    setHata(null);
    setOdaKodu(odaKoduUret());
    setAsama("lobi");
  }

  function odayaKatil(kodGirilen: string, ad: string, foto: string | null) {
    const kod = kodGirilen.trim().toUpperCase();
    if (kod.length !== 5) {
      setHata("Oda kodu 5 karakter olmalı.");
      return;
    }
    setBenim({ cihazId, ad: ad.trim(), foto });
    setHostMu(false);
    setHata(null);
    setOdaKodu(kod);
    setAsama("lobi");
  }

  function oyunuBaslat() {
    if (!hostMuRef.current) return;
    const isimler = oyuncularLobi.map((o) => o.ad);
    const fotolar = oyuncularLobi.map((o) => o.foto);
    const kimlikMap: Record<CihazId, number> = {};
    oyuncularLobi.forEach((o, i) => {
      kimlikMap[o.cihazId] = i;
    });

    let d = oyunReducer(baslangicDurumu(ayarlar), {
      tip: "oyunuKur",
      isimler,
      dagilim,
      ayarlar,
      fotolar,
    });
    if (d.asama === "dagitim") d = oyunReducer(d, { tip: "dagitimiAtla" });

    durumRef.current = d;
    setDurum(d);
    setKimlikler(kimlikMap);
    setAsama("oyun");
    yayinDurum(d, kimlikMap);
  }

  function odadanCik() {
    if (kanalRef.current) {
      const supabase = supabaseIstemcisi();
      supabase.removeChannel(kanalRef.current);
      kanalRef.current = null;
    }
    durumRef.current = null;
    setDurum(null);
    setOdaKodu("");
    setOyuncularLobi([]);
    setKimlikler({});
    setHostMu(false);
    setBenim(null);
    setRolGorulduOyunKimligi(null);
    setAsama("giris");
  }

  function skorTablosunuSifirla() {
    if (!window.confirm("Skor tablosu sıfırlansın mı? Tüm oyun geçmişi silinecek.")) return;
    try {
      window.localStorage.removeItem(SKOR_ANAHTARI);
    } catch {
      // yoksay
    }
    setSkorSurumu((v) => v + 1);
  }

  if (!agModuKullanilabilirMi()) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-10 text-center">
        <p className="text-2xl">🌐</p>
        <p className="text-sm text-white/70">
          Ağ modu şu an yapılandırılmamış (Supabase bağlantısı eksik). Tek cihazlı moda dönebilirsin.
        </p>
        <Buton onClick={onKapat}>Geri dön</Buton>
      </div>
    );
  }

  if (asama === "giris") {
    return (
      <div className="space-y-4">
        <GirisEkrani onOlustur={odaOlustur} onKatil={odayaKatil} hata={hata} />
        <Buton tamGenislik ton="hayalet" onClick={onKapat}>
          ← Tek cihaz moduna dön
        </Buton>
      </div>
    );
  }

  if (asama === "lobi" || !durum) {
    return (
      <div className="space-y-4">
        <LobiEkrani
          odaKodu={odaKodu}
          oyuncular={oyuncularLobi}
          hostMu={hostMu}
          dagilim={dagilim}
          setDagilim={setDagilim}
          ayarlar={ayarlar}
          setAyarlar={setAyarlar}
          onBaslat={oyunuBaslat}
          baslatilabilirDegilNeden={baslatmaEngeli(oyuncularLobi, dagilim)}
        />
        <Buton tamGenislik ton="hayalet" onClick={odadanCik}>
          Odadan çık
        </Buton>
      </div>
    );
  }

  const benimOyuncuId = kimlikler[cihazId];
  const benimOyuncu = durum.oyuncular.find((o) => o.id === benimOyuncuId);
  const rolGorundu = rolGorulduOyunKimligi === durum.oyunKimligi;

  if (benimOyuncuId === undefined) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-10 text-center">
        <p className="text-sm text-white/70">Bu oyun zaten başlamış, bu cihaz için bir koltuk ayrılmadı.</p>
        <Buton onClick={odadanCik}>Odadan çık</Buton>
      </div>
    );
  }

  if (benimOyuncu && !rolGorundu) {
    return <RolKarti oyuncu={benimOyuncu} onGordum={() => setRolGorulduOyunKimligi(durum.oyunKimligi)} />;
  }

  const geceAktif = durum.asama === "gece" ? geceSirasindaki(durum) : null;
  const oyVerenAktif =
    durum.asama === "oylama" ? hayattaOlanlar(durum.oyuncular)[durum.oySira] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-white/50">
          Oda <span className="font-bold text-amber-300">{odaKodu}</span>
        </p>
        <div className="flex gap-2">
          <Buton ton="hayalet" className="!px-3 !py-2 !text-xs" onClick={() => setKurallarAcik(true)}>
            Kurallar
          </Buton>
          <Buton ton="hayalet" className="!px-3 !py-2 !text-xs" onClick={odadanCik}>
            Odadan çık
          </Buton>
        </div>
      </div>

      {durum.asama === "gece" ? (
        geceAktif?.id === benimOyuncuId ? (
          <GeceEkrani
            key={`${durum.gun}-${durum.geceSira}`}
            durum={durum}
            onHedefSec={(hedefId) => agDispatch({ tip: "geceHedefSec", hedefId })}
            onSirayiTamamla={() => agDispatch({ tip: "geceSirasiniTamamla" })}
          />
        ) : (
          <AgBekleme durum={durum} siradaki={geceAktif?.ad ?? "?"} />
        )
      ) : durum.asama === "oylama" ? (
        oyVerenAktif?.id === benimOyuncuId ? (
          <GunEkrani
            durum={durum}
            onSafagiGec={() => agDispatch({ tip: "safagiGec" })}
            onTartismayaGec={() => agDispatch({ tip: "tartismayaGec" })}
            onTartismayiBitir={() => agDispatch({ tip: "tartismayiBitir" })}
            onOyVer={(hedefId) => agDispatch({ tip: "oyVer", hedefId })}
            onSonucuOnayla={() => agDispatch({ tip: "sonucuOnayla" })}
          />
        ) : (
          <AgBekleme durum={durum} siradaki={oyVerenAktif?.ad ?? "?"} />
        )
      ) : durum.asama === "bitis" ? (
        <BitisEkrani
          durum={durum}
          skor={skor}
          onAyniMasaylaYeniOyun={() => agDispatch({ tip: "ayniMasaylaYeniOyun" })}
          onYenidenBasla={odadanCik}
          onSkorSifirla={skorTablosunuSifirla}
        />
      ) : (
        // safak / tartisma / oylama-sonuc: tek bir "sırası gelen" yok, herkes görür.
        <GunEkrani
          durum={durum}
          onSafagiGec={() => agDispatch({ tip: "safagiGec" })}
          onTartismayaGec={() => agDispatch({ tip: "tartismayaGec" })}
          onTartismayiBitir={() => agDispatch({ tip: "tartismayiBitir" })}
          onOyVer={(hedefId) => agDispatch({ tip: "oyVer", hedefId })}
          onSonucuOnayla={() => agDispatch({ tip: "sonucuOnayla" })}
        />
      )}

      {kurallarAcik && <KurallarModal onKapat={() => setKurallarAcik(false)} />}
    </div>
  );
}
