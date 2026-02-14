/** 治安スコア */
export interface SafetyScore {
  id: string;
  stationId: string;
  year: number;
  month: number | null;
  totalCrimes: number;
  crimesViolent: number;
  crimesAssault: number;
  crimesTheft: number;
  crimesIntellectual: number;
  crimesOther: number;
  score: number;
  rank: number;
  previousYearTotal: number | null;
  dataGranularity: 'town' | 'municipality';
  updatedAt: string;
}
