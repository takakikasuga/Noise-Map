/** リスクレベル */
export type RiskLevel = 'none' | 'low' | 'moderate' | 'high' | 'extreme';

/** 災害リスクデータ */
export interface HazardData {
  id: string;
  stationId: string;
  floodLevel: RiskLevel;
  floodDepthMax: number | null;
  landslideWarning: boolean;
  landslideSpecial: boolean;
  tsunamiLevel: RiskLevel;
  tsunamiDepthMax: number | null;
  liquefactionRisk: 'low' | 'moderate' | 'high';
  score: number;
  rank: number;
  floodScore: number;
  landslideScore: number;
  tsunamiScore: number;
  liquefactionScore: number;
  updatedAt: string;
}
