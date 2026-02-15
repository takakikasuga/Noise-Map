/** UGC 口コミ投稿 */
export interface UgcPost {
  id: string;
  areaNameEn: string;
  content: string;
  category: 'safety' | 'noise' | 'community' | 'vibe' | 'other';
  rating: number | null;
  createdAt: string;
}
