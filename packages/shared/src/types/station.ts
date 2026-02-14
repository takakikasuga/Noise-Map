/** 駅マスタ */
export interface Station {
  id: string;
  name: string;
  nameEn: string;
  lat: number;
  lng: number;
  municipalityCode: string;
  municipalityName: string;
  lines: string[];
  createdAt: string;
}
