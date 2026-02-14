/** 雰囲気データ */
export interface VibeData {
  id: string;
  stationId: string;
  populationYoungRatio: number;
  populationFamilyRatio: number;
  populationElderlyRatio: number;
  daytimePopulationRatio: number;
  singleHouseholdRatio: number;
  restaurantCount: number;
  convenienceStoreCount: number;
  parkCount: number;
  schoolCount: number;
  hospitalCount: number;
  tags: string[];
  updatedAt: string;
}
