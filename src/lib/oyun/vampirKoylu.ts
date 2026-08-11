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

export type RolId = "vampir" | "doktor" | "gozcu" | "koylu" | "soytari" | "sagkalan";
export type Takim = "vampir" | "koy" | "tarafsiz";
/** Oyunu kimin kazandığı: iki takımdan biri ya da kendini astırmayı başaran Soytarı. */
export type Kazanan = "vampir" | "koy" | "soytari";

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
      "Her gece bir köylü seçersin. Vampirler birbirini tanır; farklı kişileri seçerseniz kurban çoğunluğa göre belirlenir. Gündüz köylü gibi davranıp şüpheyi başkasına yöneltin.",
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
  soytari: {
    id: "soytari",
    ad: "Soytarı",
    takim: "tarafsiz",
    emoji: "🃏",
    ozet: "Tek amacı kendini astırmak.",
    gorev:
      "Kimsenin takımında değilsin. Tek kazanma yolun köyü seni sürgün etmeye ikna etmek: asılırsan oyunu tek başına kazanırsın ve oyun biter. Gece öldürülürsen kaybedersin — şüphe çek ama av olma.",
    geceGorevi: false,
    renk: ["#9d174d", "#2a0a1b"],
  },
  sagkalan: {
    id: "sagkalan",
    ad: "Sağ Kalan",
    takim: "tarafsiz",
    emoji: "🎒",
    ozet: "Tek derdi hayatta kalmak.",
    gorev:
      "Kimsenin takımında değilsin. Oyun bittiğinde hâlâ hayattaysan, kazanan kim olursa olsun sen de kazanırsın. Dikkat çekme, kimseye tehdit olma, sağ kal.",
    geceGorevi: false,
    renk: ["#155e75", "#07242c"],
  },
};

export type Asama =
  | "kurulum"
  | "mod-kadro"
  | "dagitim"
  | "gece"
  | "safak"
  | "tartisma"
  | "oylama"
  | "oylama-sonuc"
  | "bitis";

/** Ölen bir oyuncunun bıraktığı veda mesajı: bir GIF ve isteğe bağlı tek kelime. */
export interface OyuncuVeda {
  gifUrl: string;
  gifId: string;
  kelime: string | null;
}

export interface Oyuncu {
  id: number;
  ad: string;
  rol: RolId;
  hayatta: boolean;
  olumNedeni: "vampir" | "infaz" | null;
  olumGunu: number | null;
  /** İsteğe bağlı, istemcide kare kırpılmış küçük JPEG data URL'i; yoksa null. */
  foto: string | null;
  /** Öldükten sonra bıraktığı veda mesajı; yazmadıysa/atladıysa null. */
  veda: OyuncuVeda | null;
  /** Veda mesajı bir kez soruldu mu (yazdı ya da atladı fark etmez) — tekrar sorulmasın diye. */
  vedaSorulduMu: boolean;
}

export interface Ayarlar {
  /** Gündüz tartışması için saniye cinsinden süre */
  tartismaSuresi: number;
  /** true: cihaz elden ele dolaşır, oylar gizli. false: masada açık oylama. */
  gizliOylama: boolean;
  /** Doktor üst üste aynı kişiyi koruyabilir mi? */
  doktorArtArdaAyniKisi: boolean;
  /**
   * Ölen ya da sürgün edilen oyuncunun rolü masaya açıklansın mı?
   * Açıkken köy bilgi kazanır (yeni başlayanlar için daha kolay),
   * kapalıyken vampirlerin blöf alanı genişler.
   */
  olulerinRoluAcik: boolean;
  /** Faz geçişlerinde ses efektleri ve (Android'de) titreşim */
  sesEfektleri: boolean;
  /**
   * Moderatörlü oyun: null ise kapalı (klasik pass & play). Dolu olduğunda bu,
   * masayı yöneten kişinin adıdır — oyuncu listesine dahil değildir, rol
   * almaz. Cihaz moderatörde kalır, hiç el değiştirmez; oylama açık yürütülür
   * (bkz. `gizliOylama` — moderatörlü oyunda kurulum ekranı bunu zorlar).
   */
  moderatorAdi: string | null;
}

export const VARSAYILAN_AYARLAR: Ayarlar = {
  tartismaSuresi: 240,
  gizliOylama: true,
  doktorArtArdaAyniKisi: false,
  olulerinRoluAcik: false,
  sesEfektleri: true,
  moderatorAdi: null,
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
  /**
   * Cihaz her gece koltuk sırasıyla hayatta olan HER oyuncuya uğrar; bu, sıradaki
   * oyuncunun hayatta olanlar listesindeki konumudur. Rol çağırmak yerine herkesin
   * sırayla geçmesi, ekranın dışını herkeste aynı yaparak rolleri gizler.
   */
  geceSira: number;
  /**
   * Moderatörlü oyunda gece sırası koltuk değil ROL bazlıdır (vampir → doktor
   * → gözcü); bu, o sıradaki rolün `moderatorGeceSirasi` içindeki indeksidir.
   */
  modGeceAdim: number;
  /** vampir oyuncu id → seçtiği kurban */
  vampirSecimleri: Record<number, number>;
  /** o gece korunan oyuncu id'leri (birden çok doktor olabilir) */
  korunanlar: number[];
  /** gözcü oyuncu id → incelediği oyuncu */
  gozcuIncelemeleri: Record<number, number>;
  /** doktor oyuncu id → önceki gece koruduğu oyuncu (art arda aynı kişi kuralı) */
  sonKorunanlar: Record<number, number>;
  /** Sırası gelen oyuncunun henüz onaylanmamış seçimi */
  buSiradakiSecim: number | null;

  /** Cihaz şu an hangi ölü oyuncuda; veda mesajı yazıyor. Yazmıyorsa null. */
  vedaYazan: number | null;

  // — şafak —
  /** Gece sonuçları uygulanıp köye duyuruldu mu? (yenilemeye karşı korumalı) */
  safakAcildi: boolean;
  safakOlen: number | null;

  // — oylama —
  oySira: number;
  oylar: Record<number, number | null>;
  oylamaSonucu: OylamaSonucu | null;

  kazanan: Kazanan | null;
  gunluk: GunlukKaydi[];
  /** Her oyuna özgü kimlik: skor tablosu aynı oyunu iki kez saymasın diye. */
  oyunKimligi: string;
}

export interface OylamaSonucu {
  infazEdilen: number | null;
  berabere: boolean;
  /** [oyuncuId, oySayısı] — çoktan aza sıralı */
  sayim: [number, number][];
  cekimser: number;
}

export const OYUN_SURUMU = 6;
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
  // Tarafsız roller varsayılanda kapalı; masa isterse kurulumdan ekler.
  return { vampir, doktor, gozcu, koylu, soytari: 0, sagkalan: 0 };
}

export function dagilimToplami(dagilim: Record<RolId, number>): number {
  return (Object.values(dagilim) as number[]).reduce((a, b) => a + b, 0);
}

/**
 * Kriptografik rastgelelik: rol kurasının "hep aynı kişilere vampir çıkıyor"
 * hissi bırakmaması için Math.random yerine cihazın gerçek entropi kaynağı
 * kullanılır (crypto yoksa Math.random'a düşer).
 */
export function guvenliRastgele(): number {
  const c = globalThis.crypto;
  if (c?.getRandomValues) {
    const dizi = new Uint32Array(1);
    c.getRandomValues(dizi);
    return dizi[0] / 4294967296;
  }
  return Math.random();
}

/** Skor takibi için kısa, oyuna özgü kimlik üretir. */
export function kimlikUret(rastgele: () => number = guvenliRastgele): string {
  return Math.floor(rastgele() * 36 ** 8).toString(36).padStart(8, "0");
}

/** Fisher–Yates. Test edilebilirlik için rastgelelik dışarıdan verilebilir. */
export function karistir<T>(dizi: T[], rastgele: () => number = guvenliRastgele): T[] {
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

/** Kazanan takım varsa döner, oyun sürüyorsa null. Tarafsızlar köy safında sayılır. */
export function kazananKontrol(oyuncular: Oyuncu[]): Kazanan | null {
  const hayatta = hayattaOlanlar(oyuncular);
  const vampirler = hayatta.filter((o) => ROLLER[o.rol].takim === "vampir").length;
  const digerleri = hayatta.length - vampirler;
  if (vampirler === 0) return "koy";
  if (vampirler >= digerleri) return "vampir";
  return null;
}

/**
 * Gecenin sonucu kaçınılmaz mı? Doktor hayatta değilse ve vampir saldırısı
 * sayıyı eşitliğe getirecekse, geceyi oynamak formaliteden ibarettir: oyun
 * geceye girmeden vampir zaferiyle biter (masada "zaten belliydi" gecesi
 * yaşanmasın diye).
 */
export function koyKurtarilamaz(oyuncular: Oyuncu[]): boolean {
  const hayatta = hayattaOlanlar(oyuncular);
  const vampirler = hayatta.filter((o) => ROLLER[o.rol].takim === "vampir").length;
  const digerleri = hayatta.length - vampirler;
  const doktorVar = hayatta.some((o) => o.rol === "doktor");
  return vampirler > 0 && !doktorVar && vampirler >= digerleri - 1;
}

/** Gece sırasında cihazı elinde tutan oyuncu (hayatta olanlar, koltuk sırasıyla). */
export function geceSirasindaki(durum: OyunDurumu): Oyuncu | undefined {
  return hayattaOlanlar(durum.oyuncular)[durum.geceSira];
}

/** Doktorun bu gece koruyamayacağı oyuncu (art arda aynı kişi kuralı). */
export function doktorYasakHedef(durum: OyunDurumu, doktorId: number): number | null {
  if (durum.ayarlar.doktorArtArdaAyniKisi) return null;
  return durum.sonKorunanlar[doktorId] ?? null;
}

/**
 * Moderatörlü oyunda gece, koltuk sırası değil ROL sırasıyla işler: moderatör
 * zaten herkesin rolünü bildiği için (bkz. Kadro ekranı) gizlemeye gerek
 * yoktur — "vampirler uyansın" der, oyuncuların işaretiyle hedefi tek
 * ekrandan girer. Sırayla vampir → doktor → gözcü, yalnızca hayatta biri
 * varsa çağrılır. Vampir en az bir kişi hayattayken (yani oyun sürerken)
 * her zaman listede olduğundan bu dizi asla boş dönmez.
 */
const MODERATOR_GECE_SIRASI: RolId[] = ["vampir", "doktor", "gozcu"];

export function moderatorGeceSirasi(oyuncular: Oyuncu[]): RolId[] {
  return MODERATOR_GECE_SIRASI.filter((rol) => rolSayisi(oyuncular, rol) > 0);
}

export function moderatorGeceSirasindaki(durum: OyunDurumu): RolId | undefined {
  return moderatorGeceSirasi(durum.oyuncular)[durum.modGeceAdim];
}

/**
 * Vampirlerin seçimlerinden kurbanı belirler. Vampirler aynı kişide birleşmezse
 * en çok oy alan; eşitlikte oy alanlar arasından rastgele biri seçilir.
 */
export function vampirKurbani(
  secimler: Record<number, number>,
  rastgele: () => number = guvenliRastgele,
): number | null {
  const sayac = new Map<number, number>();
  Object.values(secimler).forEach((hedef) => {
    if (hedef === undefined || hedef === null) return;
    sayac.set(hedef, (sayac.get(hedef) ?? 0) + 1);
  });
  if (sayac.size === 0) return null;
  const enYuksek = Math.max(...sayac.values());
  const basaBas = [...sayac.entries()].filter(([, adet]) => adet === enYuksek).map(([id]) => id);
  return basaBas[Math.floor(rastgele() * basaBas.length)];
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
    geceSira: 0,
    modGeceAdim: 0,
    vampirSecimleri: {},
    korunanlar: [],
    gozcuIncelemeleri: {},
    sonKorunanlar: {},
    buSiradakiSecim: null,
    vedaYazan: null,
    safakAcildi: false,
    safakOlen: null,
    oySira: 0,
    oylar: {},
    oylamaSonucu: null,
    kazanan: null,
    gunluk: [],
    oyunKimligi: "",
  };
}

export function baslangicDurumu(ayarlar: Ayarlar = VARSAYILAN_AYARLAR): OyunDurumu {
  return bosDurum(ayarlar);
}

/** İsim + dağılımdan rolleri karıştırıp oyuncu listesi üretir. */
export function oyunculariOlustur(
  isimler: string[],
  dagilim: Record<RolId, number>,
  rastgele: () => number = guvenliRastgele,
  fotolar?: (string | null)[],
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
    foto: fotolar?.[i] ?? null,
    veda: null,
    vedaSorulduMu: false,
  }));
}

export type OyunAksiyonu =
  | {
      tip: "oyunuKur";
      isimler: string[];
      dagilim: Record<RolId, number>;
      ayarlar: Ayarlar;
      fotolar?: (string | null)[];
      rastgele?: () => number;
    }
  | { tip: "kartiAc" }
  | { tip: "kartiKapat" }
  | { tip: "modKadroyuOnayla" }
  | { tip: "dagitimiAtla" }
  | { tip: "geceyeBasla" }
  | { tip: "geceHedefSec"; hedefId: number }
  | { tip: "geceSirasiniTamamla" }
  | { tip: "safagiGec"; rastgele?: () => number }
  | { tip: "tartismayaGec" }
  | { tip: "tartismayiBitir" }
  | { tip: "oyVer"; hedefId: number | null }
  | { tip: "oylamayiSonuclandir" }
  | { tip: "sonucuOnayla" }
  | { tip: "vedaYazmayaBasla"; oyuncuId: number }
  | { tip: "vedaKaydet"; gifUrl: string; gifId: string; kelime: string | null }
  | { tip: "vedaAtla" }
  | { tip: "ayniMasaylaYeniOyun"; rastgele?: () => number }
  | { tip: "ayarGuncelle"; ayarlar: Partial<Ayarlar> }
  | { tip: "yenidenBasla" }
  | { tip: "durumuYukle"; durum: OyunDurumu };

function log(durum: OyunDurumu, kayit: GunlukKaydi): GunlukKaydi[] {
  return [...durum.gunluk, kayit];
}

function geceSifirla(): Partial<OyunDurumu> {
  return {
    geceSira: 0,
    modGeceAdim: 0,
    vampirSecimleri: {},
    korunanlar: [],
    gozcuIncelemeleri: {},
    buSiradakiSecim: null,
    safakAcildi: false,
    safakOlen: null,
  };
}

/** Şafak sökerken gece seçimlerini uygular, ölen varsa döndürür. */
function geceyiUygula(
  durum: OyunDurumu,
  rastgele: () => number = guvenliRastgele,
): { oyuncular: Oyuncu[]; olen: number | null; hedef: number | null } {
  const hedef = vampirKurbani(durum.vampirSecimleri, rastgele);
  if (hedef === null) return { oyuncular: durum.oyuncular, olen: null, hedef };
  if (durum.korunanlar.includes(hedef)) return { oyuncular: durum.oyuncular, olen: null, hedef };
  const oyuncular = durum.oyuncular.map((o) =>
    o.id === hedef ? { ...o, hayatta: false, olumNedeni: "vampir" as const, olumGunu: durum.gun } : o,
  );
  return { oyuncular, olen: hedef, hedef };
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
      const oyuncular = oyunculariOlustur(
        aksiyon.isimler,
        aksiyon.dagilim,
        aksiyon.rastgele,
        aksiyon.fotolar,
      );
      const moderatorlu = aksiyon.ayarlar.moderatorAdi !== null;
      return {
        ...bosDurum(aksiyon.ayarlar),
        oyunKimligi: kimlikUret(aksiyon.rastgele),
        asama: moderatorlu ? "mod-kadro" : "dagitim",
        oyuncular,
        gunluk: [
          {
            gun: 1,
            tip: "sistem",
            metin: moderatorlu
              ? `${oyuncular.length} kişilik masa kuruldu. Roller ${aksiyon.ayarlar.moderatorAdi}'in ekranında.`
              : `${oyuncular.length} kişilik masa kuruldu. Roller dağıtılıyor…`,
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

    // Moderatörlü oyunda dağıtım yoktur: moderatör kadroyu tek ekranda görür,
    // onaylayınca doğrudan geceye geçilir.
    case "modKadroyuOnayla":
      if (durum.asama !== "mod-kadro") return durum;
      return { ...durum, asama: "gece", ...geceSifirla() };

    // Ağ üzerinden oyunda da dağıtım yoktur: her oyuncu rolünü zaten kendi
    // cihazında, ayrı ayrı görür (cihaz elden ele geçmez), sıra bazlı
    // dağıtım animasyonuna gerek yok.
    case "dagitimiAtla":
      if (durum.asama !== "dagitim") return durum;
      return { ...durum, dagitimSira: durum.oyuncular.length, dagitimAcik: false, asama: "gece", ...geceSifirla() };

    case "geceyeBasla":
      return { ...durum, asama: "gece", ...geceSifirla() };

    // Seçim önce geçici alanda tutulur; oyuncu sırasını tamamlayana kadar
    // fikrini değiştirebilir, devredince kalıcı olarak işlenir.
    case "geceHedefSec":
      return { ...durum, buSiradakiSecim: aksiyon.hedefId };

    case "geceSirasiniTamamla": {
      // — Moderatörlü oyun: koltuk değil ROL bazlı ilerler; bir seçim o
      // rolün TÜM canlı üyelerine aynen uygulanır (moderatör grubu tek
      // ekrandan yönetir, oyuncular birbirini zaten tanımıyor olabilir ama
      // moderatör hepsini görüyor). —
      if (durum.ayarlar.moderatorAdi) {
        const roller = moderatorGeceSirasi(durum.oyuncular);
        const rolId = roller[durum.modGeceAdim];
        const secim = durum.buSiradakiSecim;
        const islenmis: Partial<OyunDurumu> = {};

        if (rolId && secim !== null) {
          const grup = hayattaOlanlar(durum.oyuncular).filter((o) => o.rol === rolId);
          if (rolId === "vampir") {
            islenmis.vampirSecimleri = {
              ...durum.vampirSecimleri,
              ...Object.fromEntries(grup.map((o) => [o.id, secim])),
            };
          } else if (rolId === "doktor") {
            islenmis.korunanlar = [...durum.korunanlar, secim];
            islenmis.sonKorunanlar = {
              ...durum.sonKorunanlar,
              ...Object.fromEntries(grup.map((o) => [o.id, secim])),
            };
          } else if (rolId === "gozcu") {
            islenmis.gozcuIncelemeleri = {
              ...durum.gozcuIncelemeleri,
              ...Object.fromEntries(grup.map((o) => [o.id, secim])),
            };
          }
        }

        const sonraki = durum.modGeceAdim + 1;
        const bitti = sonraki >= roller.length;
        return {
          ...durum,
          ...islenmis,
          modGeceAdim: sonraki,
          buSiradakiSecim: null,
          asama: bitti ? "safak" : durum.asama,
        };
      }

      // — Normal (moderatörsüz) oyun: koltuk sırasıyla herkes —
      const oyuncu = geceSirasindaki(durum);
      const secim = durum.buSiradakiSecim;
      const islenmis: Partial<OyunDurumu> = {};

      if (oyuncu && secim !== null) {
        if (oyuncu.rol === "vampir") {
          islenmis.vampirSecimleri = { ...durum.vampirSecimleri, [oyuncu.id]: secim };
        } else if (oyuncu.rol === "doktor") {
          islenmis.korunanlar = [...durum.korunanlar, secim];
          islenmis.sonKorunanlar = { ...durum.sonKorunanlar, [oyuncu.id]: secim };
        } else if (oyuncu.rol === "gozcu") {
          islenmis.gozcuIncelemeleri = { ...durum.gozcuIncelemeleri, [oyuncu.id]: secim };
        }
      }

      const sonraki = durum.geceSira + 1;
      const bitti = sonraki >= hayattaOlanlar(durum.oyuncular).length;
      return {
        ...durum,
        ...islenmis,
        geceSira: sonraki,
        buSiradakiSecim: null,
        asama: bitti ? "safak" : durum.asama,
      };
    }

    case "safagiGec": {
      if (durum.safakAcildi) return durum;
      const { oyuncular, olen, hedef } = geceyiUygula(durum, aksiyon.rastgele);
      const olenOyuncu = oyuncuBul(oyuncular, olen);
      const kurtarildi = hedef !== null && durum.korunanlar.includes(hedef);
      const kazanan = kazananKontrol(oyuncular);
      const metin = olenOyuncu
        ? `${durum.gun}. gece: ${olenOyuncu.ad} vampirlere kurban gitti.${
            durum.ayarlar.olulerinRoluAcik ? ` Kimliği: ${ROLLER[olenOyuncu.rol].ad}.` : ""
          }`
        : kurtarildi
          ? `${durum.gun}. gece: Doktor tam zamanında yetişti, kimse ölmedi.`
          : `${durum.gun}. gece: Köyde kimse ölmedi.`;
      return {
        ...durum,
        oyuncular,
        safakAcildi: true,
        safakOlen: olen,
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

      // Soytarı asılırsa oyunu tek başına kazanır; kimlik gizleme ayarı bunu
      // etkilemez, çünkü zafer ilanının kendisi kimliği açıklar.
      if (infazEdilen?.rol === "soytari") {
        return {
          ...durum,
          oyuncular,
          kazanan: "soytari",
          asama: "bitis",
          gunluk: log(durum, {
            gun: durum.gun,
            tip: "gun",
            metin: `${durum.gun}. gün: Köy oyladı, ${infazEdilen.ad} sürgün edildi… ve Soytarı olduğu ortaya çıktı. Tam da istediği buydu — oyunu tek başına kazandı!`,
          }),
        };
      }

      const metin = infazEdilen
        ? `${durum.gun}. gün: Köy oyladı, ${infazEdilen.ad} sürgün edildi.${
            durum.ayarlar.olulerinRoluAcik ? ` Kimliği: ${ROLLER[infazEdilen.rol].ad}.` : ""
          }`
        : `${durum.gun}. gün: Oylar bölündü, kimse sürgün edilmedi.`;

      let kazanan = kazananKontrol(oyuncular);
      let gunluk = log(durum, { gun: durum.gun, tip: "gun", metin });
      // Geceye girmeden önce sonuç zaten belliyse (doktor yok, saldırı eşitliği
      // kaçınılmaz kılacak) formalite gecesi oynatma: oyun burada biter.
      if (!kazanan && koyKurtarilamaz(oyuncular)) {
        kazanan = "vampir";
        gunluk = [
          ...gunluk,
          {
            gun: durum.gun,
            tip: "sistem",
            metin:
              "Doktor kalmadı ve gece saldırısı sayıyı eşitliğe getirecekti; köy teslim oldu, gece oynanmadan vampirler kazandı.",
          },
        ];
      }

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
        gunluk,
      };
    }

    // — Veda mesajı: ölen oyuncu bir kez daha cihazı devralır, bir GIF (+
    // isteğe bağlı tek kelime) bırakır. Yalnızca ölü ve henüz sorulmamış bir
    // oyuncu için başlatılabilir; aksi halde no-op (çift dokunuş / bayat aksiyon).
    case "vedaYazmayaBasla": {
      const oyuncu = oyuncuBul(durum.oyuncular, aksiyon.oyuncuId);
      if (!oyuncu || oyuncu.hayatta || oyuncu.vedaSorulduMu) return durum;
      return { ...durum, vedaYazan: aksiyon.oyuncuId };
    }

    case "vedaKaydet": {
      if (durum.vedaYazan === null) return durum;
      const kelime = aksiyon.kelime?.trim().slice(0, 24) || null;
      return {
        ...durum,
        vedaYazan: null,
        oyuncular: durum.oyuncular.map((o) =>
          o.id === durum.vedaYazan
            ? { ...o, veda: { gifUrl: aksiyon.gifUrl, gifId: aksiyon.gifId, kelime }, vedaSorulduMu: true }
            : o,
        ),
      };
    }

    case "vedaAtla": {
      if (durum.vedaYazan === null) return durum;
      return {
        ...durum,
        vedaYazan: null,
        oyuncular: durum.oyuncular.map((o) =>
          o.id === durum.vedaYazan ? { ...o, vedaSorulduMu: true } : o,
        ),
      };
    }

    // Rövanş: isimler, oturma düzeni, rol dağılımı ve ayarlar korunur;
    // yalnızca kura yeniden çekilir. Skor tablosu ayrı sakланdığı için sürer.
    case "ayniMasaylaYeniOyun": {
      if (durum.asama !== "bitis") return durum;
      const isimler = durum.oyuncular.map((o) => o.ad);
      const fotolar = durum.oyuncular.map((o) => o.foto);
      const dagilim: Record<RolId, number> = {
        vampir: 0, doktor: 0, gozcu: 0, koylu: 0, soytari: 0, sagkalan: 0,
      };
      durum.oyuncular.forEach((o) => { dagilim[o.rol]++; });
      const oyuncular = oyunculariOlustur(isimler, dagilim, aksiyon.rastgele, fotolar);
      const moderatorlu = durum.ayarlar.moderatorAdi !== null;
      return {
        ...bosDurum(durum.ayarlar),
        oyunKimligi: kimlikUret(aksiyon.rastgele),
        asama: moderatorlu ? "mod-kadro" : "dagitim",
        oyuncular,
        gunluk: [
          { gun: 1, tip: "sistem", metin: `Aynı masa, yeni kura: ${oyuncular.length} kişilik rövanş başlıyor.` },
        ],
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
