"use client";

import { ROLLER, type OyunDurumu } from "@/lib/oyun/vampirKoylu";
import { MasaGorunumu } from "./MasaGorunumu";
import { Baslik, Buton, Panel } from "./ui";

interface BitisEkraniProps {
  durum: OyunDurumu;
  onYenidenBasla: () => void;
}

export function BitisEkrani({ durum, onYenidenBasla }: BitisEkraniProps) {
  const kazanan = durum.kazanan;
  // Soytarı yalnızca asılarak kazanır; kazanan Soytarı = infazla ölen soytarı.
  const soytariOyuncu = durum.oyuncular.find(
    (o) => o.rol === "soytari" && o.olumNedeni === "infaz",
  );
  const sagKalanlar = durum.oyuncular.filter((o) => o.rol === "sagkalan" && o.hayatta);

  const kazananlar =
    kazanan === "soytari"
      ? soytariOyuncu
        ? [soytariOyuncu]
        : []
      : durum.oyuncular.filter((o) => ROLLER[o.rol].takim === kazanan);

  return (
    <div className="space-y-5">
      <Baslik
        ustBaslik={`${durum.gun}. gün · oyun bitti`}
        baslik={
          kazanan === "soytari"
            ? "🃏 Soytarı kazandı"
            : kazanan === "vampir"
              ? "🧛 Vampirler kazandı"
              : "🌾 Köy kazandı"
        }
        aciklama={
          kazanan === "soytari"
            ? `Köy, ${soytariOyuncu?.ad ?? "Soytarı"}'yı sürgün etti — tam da istediği buydu.`
            : kazanan === "vampir"
              ? "Köyün vampirleri durduracak gücü kalmadı."
              : "Son vampir de ortaya çıkarıldı. Köy huzura kavuştu."
        }
      />

      <MasaGorunumu
        oyuncular={durum.oyuncular}
        rolleriGoster
        merkez={
          <div className="space-y-1">
            <p className="text-5xl" aria-hidden>
              {kazanan === "soytari" ? "🃏" : kazanan === "vampir" ? "🩸" : "🏆"}
            </p>
            <p className="text-xs font-bold uppercase tracking-widest text-white/60">
              tüm roller açık
            </p>
          </div>
        }
      />

      <Panel>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/50">Kazananlar</p>
        <ul className="flex flex-wrap gap-2">
          {kazananlar.map((o) => (
            <li
              key={o.id}
              className="rounded-full bg-amber-300/15 px-3 py-1 text-sm font-semibold text-amber-200"
            >
              {ROLLER[o.rol].emoji} {o.ad}
            </li>
          ))}
          {/* Sağ Kalan, oyunun sonunu hayatta gördüyse kazanan kim olursa olsun kazanır. */}
          {sagKalanlar.map((o) => (
            <li
              key={o.id}
              className="rounded-full bg-cyan-300/15 px-3 py-1 text-sm font-semibold text-cyan-200"
            >
              🎒 {o.ad} · sağ kaldı
            </li>
          ))}
        </ul>
      </Panel>

      <Panel>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/50">Olay günlüğü</p>
        <ol className="space-y-1.5">
          {durum.gunluk.map((kayit, i) => (
            <li key={i} className="flex gap-2 text-sm text-white/70">
              <span aria-hidden>{kayit.tip === "gece" ? "🌙" : kayit.tip === "gun" ? "☀️" : "•"}</span>
              <span>{kayit.metin}</span>
            </li>
          ))}
        </ol>
      </Panel>

      <Buton tamGenislik onClick={onYenidenBasla}>
        🔄 Yeni oyun kur
      </Buton>
    </div>
  );
}
