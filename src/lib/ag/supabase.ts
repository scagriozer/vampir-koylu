"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Ağ üzerinden oyun modu, oda senkronu için Supabase Realtime kullanır (broadcast
 * kanalı — veritabanı yok, sunucu kodu yok). URL ve "anon" (herkese açık, istemciye
 * gömülebilir) anahtar build-time env değişkeni olarak verilir; yoksa mod kapalı kalır.
 */
export function agModuKullanilabilirMi(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

let istemci: SupabaseClient | null = null;

export function supabaseIstemcisi(): SupabaseClient {
  if (istemci) return istemci;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anahtar = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anahtar) {
    throw new Error(
      "Supabase yapılandırılmamış: NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY gerekli.",
    );
  }
  istemci = createClient(url, anahtar);
  return istemci;
}
