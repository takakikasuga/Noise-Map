/**
 * 路線名 → URLスラッグ変換ユーティリティ
 *
 * 日本語の路線名をURLセーフなスラッグに変換する。
 * encodeURIComponent でエンコードし、デコードで元に戻す。
 */

/** 路線名をURLスラッグに変換 */
export function lineNameToSlug(name: string): string {
  return encodeURIComponent(name);
}

/** URLスラッグを路線名に復元 */
export function slugToLineName(slug: string): string {
  return decodeURIComponent(slug);
}
