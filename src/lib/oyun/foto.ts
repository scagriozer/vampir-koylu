/**
 * Oyuncu fotoğrafları tamamen istemci tarafında işlenir — sunucu, ücretli API
 * ya da gerçek AI görsel üretimi yok. Yüklenen fotoğraf kare kırpılıp küçük bir
 * JPEG'e indirgenir (localStorage'a birden fazla oyuncu fotoğrafı sığsın diye);
 * "role göre eğlenceli görünüm" ise gösterim anında Avatar bileşeninin CSS
 * rengi bindirmesiyle sağlanır (bkz. Avatar.tsx) — fotoğrafın kendisi değişmez.
 */
const HEDEF_KENAR = 192;

export function fotografiKareJpegYap(dosya: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(dosya);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const kenar = Math.min(img.width, img.height);
      const kaynakX = (img.width - kenar) / 2;
      const kaynakY = (img.height - kenar) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = HEDEF_KENAR;
      canvas.height = HEDEF_KENAR;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas bağlamı alınamadı"));
        return;
      }
      ctx.drawImage(img, kaynakX, kaynakY, kenar, kenar, 0, 0, HEDEF_KENAR, HEDEF_KENAR);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("fotoğraf okunamadı"));
    };
    img.src = url;
  });
}
