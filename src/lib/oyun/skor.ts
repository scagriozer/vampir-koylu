/**
 * Kalıcı skor tablosu.
 *
 * Oyun durumundan (OyunDurumu) ayrı yaşar: masa sıfırlansa da, rövanş
 * oynansa da birikir. Oyuncular isimle eşleştirilir (aynı masada aynı adla
 * oynayan kişi aynı kişidir varsayımı — arkadaş grubu için yeterli).
 * Saf fonksiyonlardır; localStorage okuma/yazma çağıran tarafta kalır.
 */

import { ROLLER, type OyunDurumu } from "./vampirKoylu";

export interface OyuncuSkoru {
  oyun: number;
  galibiyet: number;
  vampirCikma: number;
  soytariZaferi: number;
  sagKalma: number;
}

export interface SkorTablosu {
  surum: 1;
  oyunSayisi: number;
  takimlar: { koy: number; vampir: number; soytari: number };
  oyuncular: Record<string, OyuncuSkoru>;
  /** Aynı biten oyunun (yenileme vb. ile) iki kez sayılmasını önler. */
  sonIslenenOyun: string | null;
}

export function bosSkorTablosu(): SkorTablosu {
  return {
    surum: 1,
    oyunSayisi: 0,
    takimlar: { koy: 0, vampir: 0, soytari: 0 },
    oyuncular: {},
    sonIslenenOyun: null,
  };
}

export function gecerliSkorMu(veri: unknown): veri is SkorTablosu {
  if (!veri || typeof veri !== "object") return false;
  const t = veri as Partial<SkorTablosu>;
  return t.surum === 1 && typeof t.oyunSayisi === "number" && typeof t.oyuncular === "object";
}

function bosOyuncuSkoru(): OyuncuSkoru {
  return { oyun: 0, galibiyet: 0, vampirCikma: 0, soytariZaferi: 0, sagKalma: 0 };
}

/**
 * Biten oyunu tabloya işler. Oyun bitmemişse, kimliği yoksa ya da bu oyun
 * zaten işlendiyse tabloyu DEĞİŞTİRMEDEN aynen döndürür (referans eşitliği,
 * çağıran tarafta "yazmaya gerek var mı" kontrolü için kullanılabilir).
 */
export function oyunuIsle(tablo: SkorTablosu, durum: OyunDurumu): SkorTablosu {
  if (durum.asama !== "bitis" || !durum.kazanan) return tablo;
  if (!durum.oyunKimligi || tablo.sonIslenenOyun === durum.oyunKimligi) return tablo;

  const yeni: SkorTablosu = {
    ...tablo,
    takimlar: { ...tablo.takimlar },
    oyuncular: { ...tablo.oyuncular },
  };

  durum.oyuncular.forEach((o) => {
    const s = { ...(yeni.oyuncular[o.ad] ?? bosOyuncuSkoru()) };
    s.oyun++;
    if (ROLLER[o.rol].takim === "vampir") s.vampirCikma++;

    const soytariKazandi = o.rol === "soytari" && o.olumNedeni === "infaz" && durum.kazanan === "soytari";
    const sagKaldi = o.rol === "sagkalan" && o.hayatta;
    const takimKazandi =
      durum.kazanan !== "soytari" && ROLLER[o.rol].takim === durum.kazanan;

    if (soytariKazandi || sagKaldi || takimKazandi) s.galibiyet++;
    if (soytariKazandi) s.soytariZaferi++;
    if (sagKaldi) s.sagKalma++;

    yeni.oyuncular[o.ad] = s;
  });

  yeni.takimlar[durum.kazanan]++;
  yeni.oyunSayisi++;
  yeni.sonIslenenOyun = durum.oyunKimligi;
  return yeni;
}
