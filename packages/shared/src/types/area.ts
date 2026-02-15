/** 町丁目の治安データ */
export interface AreaSafety {
  id: string;
  areaName: string;
  nameEn: string;
  municipalityCode: string;
  municipalityName: string;
  year: number;
  totalCrimes: number;
  crimesViolent: number;
  crimesAssault: number;
  crimesTheft: number;
  crimesIntellectual: number;
  crimesOther: number;
  score: number;
  rank: number | null;
  lat: number | null;
  lng: number | null;
  previousYearTotal: number | null;
}
