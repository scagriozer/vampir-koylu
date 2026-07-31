/**
 * Vampir Köylü — masa oyunu motoru.
 *
 * Tek cihaz ("pass & play") kurgusu: oyuncular yan yana otururken telefon/tablet
 * elden ele dolaşır, uygulama anlatıcı (moderatör) rolünü üstlenir.
 *
 * Bu dosya saf (pure) mantıktır: React/DOM bağımlılığı yoktur, tüm geçişler
 * `oyunReducer` üzerinden yapılır. Böylece durum localStorage'a serialize
 * edilebilir ve sayfa yenilense bile oyun kaldığı yerden devam eder.
 */

export type RolId = "vampir" | "doktor" | "gozcu" | "koylu";
export type Takim = "vampir" | "koy";

export interface RolTanim {
  id: RolId;
  ad: string;
  takim: Takim;
  emoji: string;
  ozet: string;
  gorev: string;
  /** Gece uyanıp bir hedef seçer mi? */
  geceGorevi: boolean;
  /** Kart yüzü için degrade renkler */
  renk: [string, string];
}

export const ROLLER: Record<RolId, RolTanim> = {
  vampir: {
    id: "vampir",
    ad: "Vampir",
    takim: "vampir",
    emoji: "🧛",
    ozet: "Geceleri köyden birini avlar.",
    gorev:
      "Diğer vampirlerle birlikte her gece bir köylü seçersiniz. Gündüz köylü gibi davranıp şüpheyi başkasına yöneltin.",
    geceGorevi: true,
    renk: ["#7f1d1d", "#2b0a0a"],
  },
  doktor: {
    id: "doktor",
    ad: "Doktor",
    takim: "koy",
    emoji: "💉",
    ozet: "Her gece bir kişiyi korur.",
    gorev:
      "Her gece bir kişiyi seçersin; o kişi o gece vampir saldırısından kurtulur. Kendini de koruyabilirsin.",
    geceGorevi: true,
    renk: ["#065f46", "#04231b"],
  },
  gozcu: {
    id: "gozcu",
    ad: "Gözcü",
    takim: "koy",
    emoji: "🔮",
    ozet: "Her gece bir kişinin kimliğini öğrenir.",
    gorev:
      "Her gece bir oyuncuyu incelersin ve vampir olup olmadığını öğrenirsin. Bildiğini nasıl kullanacağın sana kalmış.",
    geceGorevi: true,
    renk: ["#4c1d95", "#1b0b3a"],
  },
  koylu: {
    id: "koylu",
    ad: "Köylü",
    takim: "koy",
    emoji: "🌾",
    ozet: "Gücü yok, sezgisi var.",
    gorev:
      "Gece bir görevin yok. Gündüz tartışmasında dikkatli dinle, çelişkileri yakala ve doğru oyu ver.",
    geceGorevi: false,
    renk: ["#78350f", "#2a1607"],
  },
};

/** Gece sırası: vampirler → doktor → gözcü */
export const GECE_SIRASI: RolId[] = ["vampir", "doktor", "gozcu"];

export type Asama =
  | "kurulum"
  | "dagitim"
  | "gece"
  | "safak"
  | "tartisma"
  | "oylama"
  | "oylama-sonuc"
  | "bitis";

export interface Oyuncu {
  id: number;
  ad: string;
  rol: RolId;
  hayatta: boolean;
  olumNedeni: "vampir" | "infaz" | null;
  olumGunu: number | null;
}

export interface Ayarlar {
  /** Gündüz tartışması için saniye cinsinden süre */
  tartismaSuresi: number;
  /** true: cihaz elden ele dolaşır, oylar gizli. false: masada açık oylama. */
  gizliOylama: boolean;
  /** Doktor üst üste aynı kişiyi koruyabilir mi? */
  doktorArtArdaAyniKisi: boolean;
}

export const VARSAYILAN_AYARLAR: Ayarlar = {
  tartismaSuresi: 180,
  gizliOylama: true,
  doktorArtArdaAyniKisi: false,
};

export interface GunlukKaydi {
  gun: number;
  tip: "gece" | "gun" | "sistem";
  metin: string;
}

export interface OyunDurumu {
  surum: number;
  asama: Asama;
  /** 1'den başlar; her gece/gündüz döngüsü bir "gün"dür. */
  gun: number;
  oyuncular: Oyuncu[];
  ayarlar: Ayarlar;

  // — rol dağıtımı —
  dagitimSira: number;
  dagitimAcik: boolean;

  // — gece —
  geceAdim: number;
  vampirHedef: number | null;
  doktorHedef: number | null;
  gozcuHedef: number | null;
  gozcuSonucGoruldu: boolean;
  sonKurtarilan: number | null;

  // — şafak —
  /** Gece sonuçları uygulanıp köye duyuruldu mu? (yenilemeye karşı korumalı) */
  safakAcildi: boolean;
  safakOlen: number | null;

  // — oylama —
  oySira: number;
  oylar: Record<number, number | null>;
  oylamaSonucu: OylamaSonucu | null;

  kazanan: Takim | null;
  gunluk: GunlukKaydi[];
}

export interface OylamaSonucu {
  infazEdilen: number | null;
  berabere: boolean;
  /** [oyuncuId, oySayısı] — çoktan aza sıralı */
  sayim: [number, number][];
  cekimser: number;
}

export const OYUN_SURUMU = 1;
export const MIN_OYUNCU = 4;
export const MAKS_OYUNCU = 12;

/**
 * Oyuncu sayısına göre önerilen rol dağılımı.
 * 6 kişi (varsayılan masa): 2 vampir, 1 doktor, 1 gözcü, 2 köylü.
 */
export function varsayilanDagilim(oyuncuSayisi: number): Record<RolId, number> {
  const vampir = Math.max(1, Math.floor(oyuncuSayisi / 3));
  const doktor = 1;
  const gozcu = 1;
  const koylu = Math.max(0, oyuncuSayisi - vampir - doktor - gozcu);
  return { vampir, doktor, gozcu, koylu };
}

export function dagilimToplami(dagilim: Record<RolId, number>): number {
  return (Object.values(dagilim) as number[]).reduce((a, b) => a + b, 0);
}

/** Fisher–Yates. Test edilebilirlik için rastgelelik dışarıdan verilebilir. */
export function karistir<T>(dizi: T[], rastgele: () => number = Math.random): T[] {
  const sonuc = [...dizi];
  for (let i = sonuc.length - 1; i > 0; i--) {
    const j = Math.floor(rastgele() * (i + 1));
    [sonuc[i], sonuc[j]] = [sonuc[j], sonuc[i]];
  }
  return sonuc;
}

export function hayattaOlanlar(oyuncular: Oyuncu[]): Oyuncu[] {
  return oyuncular.filter((o) => o.hayatta);
}

export function rolSayisi(oyuncular: Oyuncu[], rol: RolId, sadeceHayatta = true): number {
  return oyuncular.filter((o) => o.rol === rol && (!sadeceHayatta || o.hayatta)).length;
}

export function oyuncuBul(oyuncular: Oyuncu[], id: number | null): Oyuncu | undefined {
  if (id === null) return undefined;
  return oyuncular.find((o) => o.id === id);
}

/** Kazanan takım varsa döner, oyun sürüyorsa null. */
export function kazananKontrol(oyuncular: Oyuncu[]): Takim | null {
  const vampirler = hayattaOlanlar(oyuncular).filter((o) => ROLLER[o.rol].takim === "vampir").length;
  const koyluler = hayattaOlanlar(oyuncular).filter((o) => ROLLER[o.rol].takim === "koy").length;
  if (vampirler === 0) return "koy";
  if (vampirler >= koyluler) return "vampir";
  return null;
}

/** O gece sırayla uyandırılacak roller (hayatta kimse kalmadıysa atlanır). */
export function geceAdimlari(oyuncular: Oyuncu[]): RolId[] {
  return GECE_SIRASI.filter((rol) => rolSayisi(oyuncular, rol) > 0);
}

/** Doktorun bu gece koruyamayacağı oyuncu (art arda aynı kişi kuralı). */
export function doktorYasakHedef(durum: OyunDurumu): number | null {
  if (durum.ayarlar.doktorArtArdaAyniKisi) return null;
  return durum.sonKurtarilan;
}

function bosDurum(ayarlar: Ayarlar): OyunDurumu {
  return {
    surum: OYUN_SURUMU,
    asama: "kurulum",
    gun: 1,
    oyuncular: [],
    ayarlar,
    dagitimSira: 0,
    dagitimAcik: false,
    geceAdim: 0,
    vampirHedef: null,
    doktorHedef: null,
    gozcuHedef: null,
    gozcuSonucGoruldu: false,
    sonKurtarilan: null,
    safakAcildi: false,
    safakOlen: null,
    oySira: 0,
    oylar: {},
    oylamaSonucu: null,
    kazanan: null,
    gunluk: [],
  };
}

export function baslangicDurumu(ayarlar: Ayarlar = VARSAYILAN_AYARLAR): OyunDurumu {
  return bosDurum(ayarlar);
}

/** İsim + dağılımdan rolleri karıştırıp oyuncu listesi üretir. */
export function oyunculariOlustur(
  isimler: string[],
  dagilim: Record<RolId, number>,
  rastgele: () => number = Math.random,
): Oyuncu[] {
  const havuz: RolId[] = [];
  (Object.keys(dagilim) as RolId[]).forEach((rol) => {
    for (let i = 0; i < dagilim[rol]; i++) havuz.push(rol);
  });
  const karisik = karistir(havuz, rastgele);
  return isimler.map((ad, i) => ({
    id: i,
    ad: ad.trim() || `Oyuncu ${i + 1}`,
    rol: karisik[i] ?? "koylu",
    hayatta: true,
    olumNedeni: null,
    olumGunu: null,
  }));
}

export type OyunAksiyonu =
  | { tip: "oyunuKur"; isimler: string[]; dagilim: Record<RolId, number>; ayarlar: Ayarlar; rastgele?: () => number }
  | { tip: "kartiAc" }
  | { tip: "kartiKapat" }
  | { tip: "geceyeBasla" }
  | { tip: "geceHedefSec"; hedefId: number }
  | { tip: "gozcuSonucunuGor" }
  | { tip: "geceAdimiTamamla" }
  | { tip: "safagiGec" }
  | { tip: "tartismayaGec" }
  | { tip: "tartismayiBitir" }
  | { tip: "oyVer"; hedefId: number | null }
  | { tip: "oylamayiSonuclandir" }
  | { tip: "sonucuOnayla" }
  | { tip: "ayarGuncelle"; ayarlar: Partial<Ayarlar> }
  | { tip: "yenidenBasla" }
  | { tip: "durumuYukle"; durum: OyunDurumu };

function log(durum: OyunDurumu, kayit: GunlukKaydi): GunlukKaydi[] {
  return [...durum.gunluk, kayit];
}

function geceSifirla(): Partial<OyunDurumu> {
  return {
    geceAdim: 0,
    vampirHedef: null,
    doktorHedef: null,
    gozcuHedef: null,
    gozcuSonucGoruldu: false,
    safakAcildi: false,
    safakOlen: null,
  };
}

/** Şafak sökerken gece seçimlerini uygular, ölen varsa döndürür. */
function geceyiUygula(durum: OyunDurumu): { oyuncular: Oyuncu[]; olen: number | null } {
  const hedef = durum.vampirHedef;
  if (hedef === null) return { oyuncular: durum.oyuncular, olen: null };
  if (durum.doktorHedef === hedef) return { oyuncular: durum.oyuncular, olen: null };
  const oyuncular = durum.oyuncular.map((o) =>
    o.id === hedef ? { ...o, hayatta: false, olumNedeni: "vampir" as const, olumGunu: durum.gun } : o,
  );
  return { oyuncular, olen: hedef };
}

export function oylariSay(oylar: Record<number, number | null>): OylamaSonucu {
  const sayac = new Map<number, number>();
  let cekimser = 0;
  Object.values(oylar).forEach((hedef) => {
    if (hedef === null || hedef === undefined) {
      cekimser++;
      return;
    }
    sayac.set(hedef, (sayac.get(hedef) ?? 0) + 1);
  });
  const sayim = [...sayac.entries()].sort((a, b) => b[1] - a[1]) as [number, number][];
  if (sayim.length === 0) return { infazEdilen: null, berabere: false, sayim, cekimser };
  const enYuksek = sayim[0][1];
  const basaBas = sayim.filter(([, adet]) => adet === enYuksek);
  if (basaBas.length > 1) return { infazEdilen: null, berabere: true, sayim, cekimser };
  return { infazEdilen: sayim[0][0], berabere: false, sayim, cekimser };
}

export function oyunReducer(durum: OyunDurumu, aksiyon: OyunAksiyonu): OyunDurumu {
  switch (aksiyon.tip) {
    case "oyunuKur": {
      const oyuncular = oyunculariOlustur(aksiyon.isimler, aksiyon.dagilim, aksiyon.rastgele);
      return {
        ...bosDurum(aksiyon.ayarlar),
        asama: "dagitim",
        oyuncular,
        gunluk: [
          {
            gun: 1,
            tip: "sistem",
            metin: `${oyuncular.length} kişilik masa kuruldu. Roller dağıtılıyor…`,
          },
        ],
      };
    }

    case "kartiAc":
      return { ...durum, dagitimAcik: true };

    case "kartiKapat": {
      const sonraki = durum.dagitimSira + 1;
      if (sonraki >= durum.oyuncular.length) {
        return {
          ...durum,
          dagitimAcik: false,
          dagitimSira: sonraki,
          asama: "gece",
          gunluk: log(durum, { gun: 1, tip: "sistem", metin: "Tüm roller dağıtıldı. İlk gece başlıyor." }),
        };
      }
      return { ...durum, dagitimAcik: false, dagitimSira: sonraki };
    }

    case "geceyeBasla":
      return { ...durum, asama: "gece", ...geceSifirla() };

    case "geceHedefSec": {
      const adimlar = geceAdimlari(durum.oyuncular);
      const rol = adimlar[durum.geceAdim];
      if (rol === "vampir") return { ...durum, vampirHedef: aksiyon.hedefId };
      if (rol === "doktor") return { ...durum, doktorHedef: aksiyon.hedefId };
      if (rol === "gozcu") return { ...durum, gozcuHedef: aksiyon.hedefId };
      return durum;
    }

    case "gozcuSonucunuGor":
      return { ...durum, gozcuSonucGoruldu: true };

    case "geceAdimiTamamla": {
      const adimlar = geceAdimlari(durum.oyuncular);
      const sonraki = durum.geceAdim + 1;
      if (sonraki >= adimlar.length) return { ...durum, geceAdim: sonraki, asama: "safak" };
      return { ...durum, geceAdim: sonraki };
    }

    case "safagiGec": {
      if (durum.safakAcildi) return durum;
      const { oyuncular, olen } = geceyiUygula(durum);
      const olenOyuncu = oyuncuBul(oyuncular, olen);
      const kurtarildi = durum.vampirHedef !== null && durum.doktorHedef === durum.vampirHedef;
      const kazanan = kazananKontrol(oyuncular);
      const metin = olenOyuncu
        ? `${durum.gun}. gece: ${olenOyuncu.ad} vampirlere kurban gitti.`
        : kurtarildi
          ? `${durum.gun}. gece: Doktor tam zamanında yetişti, kimse ölmedi.`
          : `${durum.gun}. gece: Köyde kimse ölmedi.`;
      return {
        ...durum,
        oyuncular,
        safakAcildi: true,
        safakOlen: olen,
        sonKurtarilan: durum.doktorHedef,
        asama: kazanan ? "bitis" : "safak",
        kazanan,
        gunluk: log(durum, { gun: durum.gun, tip: "gece", metin }),
      };
    }

    case "tartismayaGec":
      return { ...durum, asama: "tartisma" };

    case "tartismayiBitir":
      return { ...durum, asama: "oylama", oySira: 0, oylar: {}, oylamaSonucu: null };

    case "oyVer": {
      const hayatta = hayattaOlanlar(durum.oyuncular);
      const oyVeren = hayatta[durum.oySira];
      if (!oyVeren) return durum;
      const oylar = { ...durum.oylar, [oyVeren.id]: aksiyon.hedefId };
      const sonraki = durum.oySira + 1;
      if (sonraki >= hayatta.length) {
        return { ...durum, oylar, oySira: sonraki, oylamaSonucu: oylariSay(oylar), asama: "oylama-sonuc" };
      }
      return { ...durum, oylar, oySira: sonraki };
    }

    case "oylamayiSonuclandir":
      return { ...durum, oylamaSonucu: oylariSay(durum.oylar), asama: "oylama-sonuc" };

    case "sonucuOnayla": {
      const infaz = durum.oylamaSonucu?.infazEdilen ?? null;
      const oyuncular =
        infaz === null
          ? durum.oyuncular
          : durum.oyuncular.map((o) =>
              o.id === infaz ? { ...o, hayatta: false, olumNedeni: "infaz" as const, olumGunu: durum.gun } : o,
            );
      const infazEdilen = oyuncuBul(oyuncular, infaz);
      const metin = infazEdilen
        ? `${durum.gun}. gün: Köy oyladı, ${infazEdilen.ad} sürgün edildi. Kimliği: ${ROLLER[infazEdilen.rol].ad}.`
        : `${durum.gun}. gün: Oylar bölündü, kimse sürgün edilmedi.`;
      const kazanan = kazananKontrol(oyuncular);
      return {
        ...durum,
        oyuncular,
        kazanan,
        asama: kazanan ? "bitis" : "gece",
        gun: kazanan ? durum.gun : durum.gun + 1,
        ...geceSifirla(),
        oylar: {},
        oySira: 0,
        oylamaSonucu: null,
        gunluk: log(durum, { gun: durum.gun, tip: "gun", metin }),
      };
    }

    case "ayarGuncelle":
      return { ...durum, ayarlar: { ...durum.ayarlar, ...aksiyon.ayarlar } };

    case "yenidenBasla":
      return bosDurum(durum.ayarlar);

    case "durumuYukle":
      return aksiyon.durum;

    default:
      return durum;
  }
}

/** localStorage'dan okunan verinin bu sürümle uyumlu olup olmadığını kabaca doğrular. */
export function gecerliDurumMu(veri: unknown): veri is OyunDurumu {
  if (!veri || typeof veri !== "object") return false;
  const d = veri as Partial<OyunDurumu>;
  return d.surum === OYUN_SURUMU && Array.isArray(d.oyuncular) && typeof d.asama === "string";
}
