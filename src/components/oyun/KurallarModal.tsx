"use client";

import { ROLLER, type RolId } from "@/lib/oyun/vampirKoylu";
import { Buton } from "./ui";

const ROL_SIRASI: RolId[] = ["vampir", "doktor", "gozcu", "koylu", "soytari", "sagkalan"];

const AKIS = [
  {
    baslik: "1 · Roller dağıtılır",
    metin:
      "Cihaz sırayla her oyuncuya verilir. Herkes kartını gizlice görür, ezberler ve kapatıp yanındakine uzatır.",
  },
  {
    baslik: "2 · Gece",
    metin:
      "Cihaz koltuk sırasıyla herkese uğrar. Vampir avını, doktor koruduğu kişiyi, gözcü incelediği kişiyi seçer; gece görevi olmayan köylü de sırasını alıp devreder. Ekranın dışı herkeste aynı olduğu için kimse kimsenin rolünü çıkaramaz.",
  },
  {
    baslik: "3 · Şafak",
    metin:
      "Gece kimin öldüğü açıklanır. Ölen oyuncu konuşamaz ve oy kullanamaz. Kimliğinin açıklanıp açıklanmayacağı kurulumdaki ayara bağlıdır.",
  },
  {
    baslik: "4 · Tartışma",
    metin: "Geri sayım boyunca herkes konuşur, savunma yapar, şüphelerini paylaşır.",
  },
  {
    baslik: "5 · Oylama",
    metin:
      "Hayatta olan herkes sırayla oy verir. En çok oyu alan sürgün edilir. Beraberlikte kimse gitmez.",
  },
  {
    baslik: "6 · Kazanma",
    metin:
      "Tüm vampirler elenirse köy kazanır; vampir sayısı diğerlerine eşitlenirse vampirler kazanır. Soytarı asılırsa oyunu tek başına kazanır ve oyun anında biter. Sağ Kalan, oyun sonunda hayattaysa kazananlara katılır. Doktor hayatta değilken gece saldırısı sayıyı eşitliğe getirecekse oyun geceye girmeden vampir zaferiyle biter.",
  },
];

export function KurallarModal({ onKapat }: { onKapat: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Oyun kuralları"
      onClick={onKapat}
    >
      <div
        className="max-h-[85dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-3xl border border-white/10 bg-[#131a2f] p-6 sm:rounded-3xl"
        // Alt kenar telefonun ana ekran çubuğunun altında kalmasın.
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-black text-white">Nasıl oynanır?</h3>
        <p className="mt-1 text-sm text-white/60">
          Tek cihazla, masa etrafında. Uygulama anlatıcıdır; siz sadece sırayla telefonu devredin.
        </p>

        <h4 className="mt-5 text-xs font-bold uppercase tracking-widest text-amber-300/80">Roller</h4>
        <ul className="mt-2 space-y-2">
          {ROL_SIRASI.map((id) => {
            const rol = ROLLER[id];
            return (
              <li key={id} className="flex gap-3 rounded-xl bg-white/[0.04] p-3">
                <span className="text-xl" aria-hidden>
                  {rol.emoji}
                </span>
                <div>
                  <p className="text-sm font-bold text-white">
                    {rol.ad}{" "}
                    <span
                      className={`ml-1 rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold uppercase ${
                        rol.takim === "vampir"
                          ? "bg-red-500/20 text-red-200"
                          : rol.takim === "koy"
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-fuchsia-500/20 text-fuchsia-200"
                      }`}
                    >
                      {rol.takim === "vampir" ? "vampir" : rol.takim === "koy" ? "köy" : "tarafsız"}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/65">{rol.gorev}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <h4 className="mt-5 text-xs font-bold uppercase tracking-widest text-amber-300/80">Tur akışı</h4>
        <ol className="mt-2 space-y-2">
          {AKIS.map((adim) => (
            <li key={adim.baslik} className="rounded-xl bg-white/[0.04] p-3">
              <p className="text-sm font-bold text-white">{adim.baslik}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-white/65">{adim.metin}</p>
            </li>
          ))}
        </ol>

        <h4 className="mt-5 text-xs font-bold uppercase tracking-widest text-amber-300/80">
          Moderatörlü oyun
        </h4>
        <div className="mt-2 rounded-xl bg-white/[0.04] p-3">
          <p className="text-xs leading-relaxed text-white/65">
            Kurulumda bir kişiyi moderatör seçebilirsiniz: cihaz o kişide kalır, hiç el
            değiştirmez. Moderatör oyuncu değildir, rol almaz — kadroyu tek ekranda görür ve
            herkese kendi rolünü ayrı ayrı, gizlice söyler. Gece koltuk sırası yerine rol sırasıyla
            işler (vampir → doktor → gözcü); moderatör oyuncuların işaretiyle hedefi masadan
            seçer. Oynarken kadroya tekrar bakmak için üst çubuktaki &quot;Kadro&quot; butonunu
            kullanabilir. Oylama bu modda her zaman açık yürütülür.
          </p>
        </div>

        <div className="mt-6">
          <Buton tamGenislik ton="ikincil" onClick={onKapat}>
            Kapat
          </Buton>
        </div>
      </div>
    </div>
  );
}
