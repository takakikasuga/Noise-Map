import { createClient } from '@supabase/supabase-js';

/**
 * Supabase クライアント初期化
 * サーバーサイド用（service role key 使用）
 */
export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase の環境変数が設定されていません');
  }

  return createClient(url, key);
}

/**
 * Supabase クライアント初期化
 * クライアントサイド用（anon key 使用）
 */
export function createSupabasePublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase の環境変数が設定されていません');
  }

  return createClient(url, key);
}
