"use client";

import type { RolTanim } from "@/lib/oyun/vampirKoylu";

interface AvatarProps {
  foto: string | null;
  /** Fotoğraf yoksa gösterilecek emoji (mevcut masked/rol emojisi davranışı). */
  emoji: string;
  /**
   * Rol görünürse ve verilirse, fotoğrafın üstüne rolün rengiyle eğlenceli bir
   * ton bindirilir ve köşeye rol emojisi rozeti eklenir. null: rol gizli,
   * fotoğraf düz gösterilir (fotoğrafın kendisi rol bilgisi sızdırmaz).
   */
  rol?: RolTanim | null;
  olu?: boolean;
  boyutRem?: number;
}

/** Fotoğraf yoksa eski davranış (düz emoji) korunur; varsa yuvarlak avatar gösterilir. */
export function Avatar({ foto, emoji, rol = null, olu = false, boyutRem = 2.25 }: AvatarProps) {
  if (!foto) {
    return (
      <span className="text-xl leading-none" aria-hidden>
        {emoji}
      </span>
    );
  }

  return (
    <span
      className="relative block shrink-0 overflow-hidden rounded-full border border-white/20"
      style={{ width: `${boyutRem}rem`, height: `${boyutRem}rem` }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- statik export, data URL; next/image gereksiz */}
      <img src={foto} alt="" className={`h-full w-full object-cover ${olu ? "grayscale" : ""}`} />
      {olu && (
        <>
          <span className="absolute inset-0 bg-black/55" />
          <span className="absolute inset-0 flex items-center justify-center text-[1.1em]">💀</span>
        </>
      )}
      {!olu && rol && (
        <>
          <span
            className="absolute inset-0"
            style={{
              background: `linear-gradient(160deg, ${rol.renk[0]}, ${rol.renk[1]})`,
              opacity: 0.72,
              mixBlendMode: "color",
            }}
          />
          <span className="absolute bottom-0 right-0 flex h-[42%] w-[42%] items-center justify-center rounded-full bg-black/60 text-[0.65em] leading-none">
            {rol.emoji}
          </span>
        </>
      )}
    </span>
  );
}
