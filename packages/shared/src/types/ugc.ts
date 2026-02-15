/** UGC 口コミ投稿 */
export interface UgcPost {
  id: string;
  stationId: string | null;
  areaNameEn: string | null;
  content: string;
  category: 'safety' | 'noise' | 'community' | 'vibe' | 'other';
  rating: number | null;
  createdAt: string;
}
