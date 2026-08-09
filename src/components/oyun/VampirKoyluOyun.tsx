"use client";

import { useEffect, useReducer, useRef, useState } from "react";
// Bu bileşen yalnızca istemcide (ssr: false) yüklenir; bu yüzden ilk render'da
// localStorage'ı doğrudan okumak güvenlidir, hydration uyuşmazlığı oluşmaz.
import {
  VARSAYILAN_AYARLAR,
  baslangicDurumu,
  gecerliDurumMu,
  hayattaOlanlar,
  oyunReducer,
  type Ayarlar,
  type RolId,
} from "@/lib/oyun/vampirKoylu";
import { kurtulusCal, sesAyarla, sesCal, titret } from "@/lib/oyun/sesler";
import { BitisEkrani } from "./BitisEkrani";
import { DagitimEkrani } from "./DagitimEkrani";
import { GeceEkrani } from "./GeceEkrani";
import { GunEkrani } from "./GunEkrani";
import { KurallarModal } from "./KurallarModal";
import { KurulumEkrani } from "./KurulumEkrani";
import { Buton } from "./ui";

const DEPO_ANAHTARI = "vampir-koylu-durum";

const ASAMA_ETIKETI: Record<string, string> = {
  kurulum: "Masa kurulumu",
  dagitim: "Rol dağıtımı",
  gece: "Gece",
  safak: "Şafak",
  tartisma: "Tartışma",
  oylama: "Oylama",
  "oylama-sonuc": "Karar",
  bitis: "Oyun bitti",
};

/** Devam eden oyunu geri yükler; kayıt yoksa/bozuksa temiz kurulumla başlar. */
function kayitliDurumuOku() {
  try {
    const ham = window.localStorage.getItem(DEPO_ANAHTARI);
    if (ham) {
      const veri: unknown = JSON.parse(ham);
      if (gecerliDurumMu(veri) && veri.asama !== "kurulum") {
        // Sonradan eklenen ayarlar eski kayıtlarda olmayabilir; varsayılanla doldur.
        return { ...veri, ayarlar: { ...VARSAYILAN_AYARLAR, ...veri.ayarlar } };
      }
    }
  } catch {
    // Bozuk/erişilemez depo: sessizce yeni oyunla devam et.
  }
  return baslangicDurumu();
}

export function VampirKoyluOyun() {
  const [durum, dispatch] = useReducer(oyunReducer, undefined, kayitliDurumuOku);
  const [kurallarAcik, setKurallarAcik] = useState(false);
  const tepeRef = useRef<HTMLDivElement>(null);
  const ilkRenderRef = useRef(true);

  // Her yeni adımda ekranın başına dön ve kısa bir titreşimle "sıra değişti"
  // sinyali ver: cihaz elden ele geçerken sıradaki oyuncu adımın başında karşılansın.
  const adimAnahtari = `${durum.asama}-${durum.gun}-${durum.geceSira}-${durum.oySira}-${durum.dagitimSira}-${durum.dagitimAcik}`;
  useEffect(() => {
    if (ilkRenderRef.current) {
      ilkRenderRef.current = false;
      return;
    }
    tepeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    titret(25);
  }, [adimAnahtari]);

  // Ses ayarını modüle aktar ve faz geçişlerinde efekt çal.
  useEffect(() => {
    sesAyarla(durum.ayarlar.sesEfektleri);
  }, [durum.ayarlar.sesEfektleri]);

  const oncekiFazRef = useRef({ asama: durum.asama, safakAcildi: durum.safakAcildi });
  useEffect(() => {
    const onceki = oncekiFazRef.current;
    oncekiFazRef.current = { asama: durum.asama, safakAcildi: durum.safakAcildi };

    if (durum.asama === "gece" && onceki.asama !== "gece") {
      sesCal("gece");
      titret([40, 80, 40]);
    }
    if (
      durum.asama === "safak" &&
      durum.safakAcildi &&
      !(onceki.asama === "safak" && onceki.safakAcildi)
    ) {
      // Kimse ölmediyse (doktor kurtardıysa) eğlenceli kurtuluş klibi; ölüm varsa tok vuruş.
      if (durum.safakOlen !== null) sesCal("olum");
      else kurtulusCal();
    }
    if (durum.asama === "bitis" && onceki.asama !== "bitis") {
      sesCal("zafer");
      titret([60, 60, 60, 60, 200]);
    }
  }, [durum.asama, durum.safakAcildi, durum.safakOlen]);

  const sonYazilanRef = useRef<string | null>(null);
  useEffect(() => {
    try {
      if (durum.asama === "kurulum") {
        window.localStorage.removeItem(DEPO_ANAHTARI);
        sonYazilanRef.current = null;
      } else {
        const ham = JSON.stringify(durum);
        window.localStorage.setItem(DEPO_ANAHTARI, ham);
        sonYazilanRef.current = ham;
      }
    } catch {
      // Depolama kapalıysa oyun yine de oynanabilir.
    }
  }, [durum]);

  // Ekran kilidi/sekme değişimi sonrası: tarayıcı sayfanın eski bir anlık
  // görüntüsünü geri getirmiş ya da oyun başka bir sekmede ilerlemiş olabilir.
  // Görünür olunca kayıtlı durum ekrandakinden farklıysa kayıtlı olan benimsenir;
  // tek doğruluk kaynağı localStorage'dır.
  useEffect(() => {
    const uyumla = () => {
      if (document.visibilityState !== "visible") return;
      try {
        const ham = window.localStorage.getItem(DEPO_ANAHTARI);
        if (!ham || ham === sonYazilanRef.current) return;
        const veri: unknown = JSON.parse(ham);
        if (gecerliDurumMu(veri)) dispatch({ tip: "durumuYukle", durum: veri });
      } catch {
        // Bozuk kayıt: ekrandaki durumla devam et.
      }
    };
    document.addEventListener("visibilitychange", uyumla);
    window.addEventListener("pageshow", uyumla);
    return () => {
      document.removeEventListener("visibilitychange", uyumla);
      window.removeEventListener("pageshow", uyumla);
    };
  }, []);

  function yenidenBasla() {
    if (durum.asama !== "bitis" && durum.asama !== "kurulum") {
      const onay = window.confirm("Oyun sıfırlansın mı? Mevcut masa silinecek.");
      if (!onay) return;
    }
    dispatch({ tip: "yenidenBasla" });
  }

  function oyunuKur(isimler: string[], dagilim: Record<RolId, number>, ayarlar: Ayarlar) {
    dispatch({ tip: "oyunuKur", isimler, dagilim, ayarlar });
  }

  const gece = durum.asama === "gece";
  const hayattaSayisi = hayattaOlanlar(durum.oyuncular).length;

  return (
    <div
      // min-h-dvh: iOS Safari'de adres çubuğu açılıp kapanırken ekran boyu doğru kalsın.
      className={`min-h-dvh transition-colors duration-700 ${
        gece
          ? "bg-[radial-gradient(ellipse_at_top,#1b2450,#080b18_60%)]"
          : "bg-[radial-gradient(ellipse_at_top,#1d2440,#0b1020_60%)]"
      }`}
    >
      <div
        ref={tepeRef}
        className="mx-auto w-full max-w-2xl scroll-mt-4 px-4 pb-16 pt-6 sm:px-6"
        style={{
          // Çentik / ana ekran çubuğu içeriği kesmesin (tam ekran PWA modu).
          paddingTop: "calc(1.5rem + env(safe-area-inset-top))",
          paddingBottom: "calc(4rem + env(safe-area-inset-bottom))",
        }}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-black leading-tight text-white sm:text-lg">
              🧛 Vampir Köylü
            </p>
            {/* Aşama adı zaten ekranın başlığında; dar telefonlarda kesilmesin diye
                üst çubukta yalnızca gün ve hayatta kalan sayısı gösteriliyor. */}
            <p className="truncate text-xs text-white/50">
              {durum.oyuncular.length > 0 && durum.asama !== "kurulum"
                ? `${durum.gun}. gün · ${hayattaSayisi}/${durum.oyuncular.length} hayatta`
                : (ASAMA_ETIKETI[durum.asama] ?? "")}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Buton ton="hayalet" className="!px-3 !py-2 !text-xs" onClick={() => setKurallarAcik(true)}>
              Kurallar
            </Buton>
            {durum.asama !== "kurulum" && (
              <Buton ton="hayalet" className="!px-3 !py-2 !text-xs" onClick={yenidenBasla}>
                Sıfırla
              </Buton>
            )}
          </div>
        </div>

        {durum.asama === "kurulum" ? (
          <KurulumEkrani onBasla={oyunuKur} />
        ) : durum.asama === "dagitim" ? (
          <DagitimEkrani
            oyuncu={durum.oyuncular[durum.dagitimSira]}
            sira={durum.dagitimSira}
            toplam={durum.oyuncular.length}
            acik={durum.dagitimAcik}
            onAc={() => dispatch({ tip: "kartiAc" })}
            onKapat={() => dispatch({ tip: "kartiKapat" })}
          />
        ) : durum.asama === "gece" ? (
          <GeceEkrani
            key={`${durum.gun}-${durum.geceSira}`}
            durum={durum}
            onHedefSec={(hedefId) => dispatch({ tip: "geceHedefSec", hedefId })}
            onSirayiTamamla={() => dispatch({ tip: "geceSirasiniTamamla" })}
          />
        ) : durum.asama === "bitis" ? (
          <BitisEkrani durum={durum} onYenidenBasla={() => dispatch({ tip: "yenidenBasla" })} />
        ) : (
          <GunEkrani
            durum={durum}
            onSafagiGec={() => dispatch({ tip: "safagiGec" })}
            onTartismayaGec={() => dispatch({ tip: "tartismayaGec" })}
            onTartismayiBitir={() => dispatch({ tip: "tartismayiBitir" })}
            onOyVer={(hedefId) => dispatch({ tip: "oyVer", hedefId })}
            onSonucuOnayla={() => dispatch({ tip: "sonucuOnayla" })}
          />
        )}
      </div>

      {kurallarAcik && <KurallarModal onKapat={() => setKurallarAcik(false)} />}
    </div>
  );
}
