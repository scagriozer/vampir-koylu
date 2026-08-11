"use client";

/**
 * Veda mesajı için GIF arama. Giphy'nin herkese açık REST API'sini doğrudan
 * tarayıcıdan çağırır (sunucu kodu yok). Anahtar build-time env değişkeni
 * olarak verilir; yoksa GIF seçimi devre dışı kalır, veda yalnızca tek
 * kelimeyle bırakılabilir (bkz. VedaEkrani).
 */
export function giphyYapilandirilmisMi(): boolean {
  return !!process.env.NEXT_PUBLIC_GIPHY_API_KEY;
}

export interface GifSonucu {
  id: string;
  baslik: string;
  /** Küçük, hızlı yüklenen önizleme (arama sonuçları ızgarası için) */
  onizlemeUrl: string;
  /** Seçildikten sonra veda kartında gösterilecek tam boyutlu GIF */
  tamUrl: string;
}

interface GiphyGorsel {
  url: string;
}

interface GiphyOge {
  id: string;
  title: string;
  images: {
    fixed_width_small?: GiphyGorsel;
    preview_gif?: GiphyGorsel;
    fixed_width?: GiphyGorsel;
    original?: GiphyGorsel;
  };
}

function ogeyiDonustur(oge: GiphyOge): GifSonucu {
  return {
    id: oge.id,
    baslik: oge.title || "GIF",
    onizlemeUrl: oge.images.fixed_width_small?.url ?? oge.images.preview_gif?.url ?? oge.images.fixed_width?.url ?? "",
    tamUrl: oge.images.fixed_width?.url ?? oge.images.original?.url ?? "",
  };
}

async function giphyIstegi(yol: string, parametreler: Record<string, string>): Promise<GifSonucu[]> {
  const anahtar = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
  if (!anahtar) throw new Error("Giphy yapılandırılmamış: NEXT_PUBLIC_GIPHY_API_KEY gerekli.");
  const arama = new URLSearchParams({ api_key: anahtar, rating: "pg-13", lang: "tr", ...parametreler });
  const yanit = await fetch(`https://api.giphy.com/v1/gifs/${yol}?${arama.toString()}`);
  if (!yanit.ok) throw new Error(`Giphy isteği başarısız (${yanit.status}).`);
  const veri = await yanit.json();
  const ogeler: GiphyOge[] = veri?.data ?? [];
  return ogeler.map(ogeyiDonustur).filter((g) => g.onizlemeUrl && g.tamUrl);
}

export function giphyAra(sorgu: string, limit = 15): Promise<GifSonucu[]> {
  return giphyIstegi("search", { q: sorgu, limit: String(limit) });
}

export function giphyTrendler(limit = 15): Promise<GifSonucu[]> {
  return giphyIstegi("trending", { limit: String(limit) });
}
