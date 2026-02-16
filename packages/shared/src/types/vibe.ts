/** エリア（丁目）単位の雰囲気データ */
export interface AreaVibeData {
  id: string;
  areaName: string;
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
