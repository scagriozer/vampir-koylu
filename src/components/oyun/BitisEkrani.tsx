"use client";

import { ROLLER, type OyunDurumu } from "@/lib/oyun/vampirKoylu";
import type { SkorTablosu } from "@/lib/oyun/skor";
import { MasaGorunumu } from "./MasaGorunumu";
import { Baslik, Buton, Panel } from "./ui";

interface BitisEkraniProps {
  durum: OyunDurumu;
  skor: SkorTablosu;
  onAyniMasaylaYeniOyun: () => void;
  onYenidenBasla: () => void;
  onSkorSifirla: () => void;
}

export function BitisEkrani({
  durum,
  skor,
  onAyniMasaylaYeniOyun,
  onYenidenBasla,
  onSkorSifirla,
}: BitisEkraniProps) {
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
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-white/50">
            Skor tablosu · {skor.oyunSayisi} oyun
          </p>
          <button
            type="button"
            onClick={onSkorSifirla}
            className="-my-2 inline-flex min-h-11 items-center px-2 text-xs font-semibold text-white/40 underline-offset-2 hover:text-white/70 hover:underline"
          >
            Sıfırla
          </button>
        </div>
        <p className="mb-3 text-center text-sm font-bold text-white">
          🌾 Köy {skor.takimlar.koy} — {skor.takimlar.vampir} Vampir 🧛
          {skor.takimlar.soytari > 0 && (
            <span className="text-white/60"> · 🃏 {skor.takimlar.soytari}</span>
          )}
        </p>
        <ul className="space-y-1">
          {Object.entries(skor.oyuncular)
            .sort((a, b) => b[1].galibiyet - a[1].galibiyet || b[1].oyun - a[1].oyun)
            .map(([ad, s]) => (
              <li key={ad} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate font-semibold text-white">{ad}</span>
                <span className="shrink-0 text-white/70">
                  {s.galibiyet}G / {s.oyun}O
                </span>
                <span className="w-20 shrink-0 text-right text-xs text-white/50">
                  🧛×{s.vampirCikma}
                  {s.soytariZaferi > 0 && ` 🃏×${s.soytariZaferi}`}
                  {s.sagKalma > 0 && ` 🎒×${s.sagKalma}`}
                </span>
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

      {/* Rövanş: aynı isimler, aynı dağılım, aynı ayarlar — sadece kura yeniden çekilir. */}
      <Buton tamGenislik onClick={onAyniMasaylaYeniOyun}>
        🔁 Aynı masayla tekrar oyna
      </Buton>
      <Buton tamGenislik ton="ikincil" onClick={onYenidenBasla}>
        🧹 Masayı değiştir · yeni kurulum
      </Buton>
    </div>
  );
}
