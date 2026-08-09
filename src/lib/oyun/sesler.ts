/**
 * Ses ve titreşim efektleri.
 *
 * Efektler dosya indirmek yerine Web Audio ile anında sentezlenir; böylece
 * uygulama tamamen statik ve çevrimdışı çalışabilir kalır. iOS ses bağlamını
 * ancak bir kullanıcı dokunuşu içinde açmaya izin verdiği için
 * `sesleriEtkinlestir` her buton dokunuşunda çağrılır (bkz. ui.tsx); bir kez
 * açılan bağlam, dokunuş dışından tetiklenen seslerde de (sayaç, faz geçişi)
 * çalmaya devam eder.
 */

let baglam: AudioContext | null = null;
let etkin = true;

export function sesAyarla(deger: boolean) {
  etkin = deger;
}

/** Kullanıcı dokunuşu içinde çağrılmalı; ses bağlamını kurar/uyandırır. */
export function sesleriEtkinlestir() {
  if (!etkin || typeof window === "undefined") return;
  try {
    baglam ??= new AudioContext();
    if (baglam.state === "suspended") void baglam.resume();
    // Özel klibi (varsa) şafak anında beklemeden çalabilmek için önden yükle.
    void klipYukle();
  } catch {
    // Ses desteklenmiyorsa oyun sessiz devam eder.
  }
}

// — Özel "kurtuluş" klibi —
// Depoya public/sesler/essela.mp3 eklenirse "kimse ölmedi" şafağında ilk
// KLIP_SURE saniyesi çalar ve KLIP_FADE saniyede kısılarak susar. Dosya yoksa
// sentezlenmiş şafak sesine düşülür. (Göreli yol: sayfa alt yolda yayınlansa da
// — GitHub Pages — doğru adrese çözünür.)
const KLIP_URL = "sesler/essela.mp3";
const KLIP_SURE = 4;
const KLIP_FADE = 1.5;
let klipTampon: AudioBuffer | null | undefined;

async function klipYukle(): Promise<AudioBuffer | null> {
  if (klipTampon !== undefined) return klipTampon;
  klipTampon = null;
  try {
    const yanit = await fetch(KLIP_URL);
    if (yanit.ok && baglam) {
      klipTampon = await baglam.decodeAudioData(await yanit.arrayBuffer());
    }
  } catch {
    // Klip yok/çözülemedi: sentez sese düşülecek.
  }
  return klipTampon;
}

/** "Kimse ölmedi" şafağı: özel klip varsa onu, yoksa sentez şafak sesini çalar. */
export function kurtulusCal() {
  if (!etkin) return;
  sesleriEtkinlestir();
  if (!baglam) return;
  void klipYukle().then((tampon) => {
    if (!baglam) return;
    if (!tampon) {
      sesCal("safak");
      return;
    }
    const kaynak = baglam.createBufferSource();
    kaynak.buffer = tampon;
    const kazanc = baglam.createGain();
    const t = baglam.currentTime;
    kazanc.gain.setValueAtTime(0.9, t);
    kazanc.gain.setValueAtTime(0.9, t + KLIP_SURE);
    kazanc.gain.linearRampToValueAtTime(0.0001, t + KLIP_SURE + KLIP_FADE);
    kaynak.connect(kazanc);
    kazanc.connect(baglam.destination);
    kaynak.start(t);
    kaynak.stop(t + KLIP_SURE + KLIP_FADE + 0.1);
  });
}

function nota(
  frekans: number,
  gecikme: number,
  sure: number,
  tip: OscillatorType,
  siddet: number,
) {
  if (!baglam) return;
  const osilator = baglam.createOscillator();
  const kazanc = baglam.createGain();
  osilator.type = tip;
  osilator.frequency.value = frekans;
  const t = baglam.currentTime + gecikme;
  kazanc.gain.setValueAtTime(0, t);
  kazanc.gain.linearRampToValueAtTime(siddet, t + 0.02);
  kazanc.gain.exponentialRampToValueAtTime(0.001, t + sure);
  osilator.connect(kazanc);
  kazanc.connect(baglam.destination);
  osilator.start(t);
  osilator.stop(t + sure + 0.05);
}

export type SesTipi = "gece" | "safak" | "olum" | "tik" | "sureDoldu" | "zafer";

export function sesCal(tip: SesTipi) {
  if (!etkin) return;
  sesleriEtkinlestir();
  if (!baglam) return;
  switch (tip) {
    case "gece": // alçalan iki karanlık nota
      nota(196, 0, 0.4, "sine", 0.12);
      nota(147, 0.25, 0.6, "sine", 0.12);
      break;
    case "safak": // yumuşak, kısık bir sabah çanı
      nota(330, 0, 0.3, "sine", 0.05);
      nota(415, 0.18, 0.45, "sine", 0.05);
      break;
    case "olum": // boğuk tok vuruş
      nota(110, 0, 0.5, "sawtooth", 0.1);
      nota(82, 0.1, 0.6, "sawtooth", 0.08);
      break;
    case "tik": // son saniyeler
      nota(1250, 0, 0.05, "square", 0.04);
      break;
    case "sureDoldu":
      [0, 0.2, 0.4].forEach((g) => nota(880, g, 0.12, "square", 0.08));
      break;
    case "zafer":
      [523, 659, 784, 1047].forEach((f, i) => nota(f, i * 0.13, 0.3, "triangle", 0.1));
      break;
  }
}

/** Titreşim: iOS Safari desteklemez, Android'de çalışır; her yerde güvenle çağrılabilir. */
export function titret(desen: number | number[]) {
  if (!etkin || typeof navigator === "undefined") return;
  try {
    navigator.vibrate?.(desen);
  } catch {
    // desteklenmiyor
  }
}
