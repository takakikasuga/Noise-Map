/** 7層ノイズレイヤー定義 */
export const NOISE_LAYERS = [
  { id: 'safety', name: '治安', nameEn: 'Safety', icon: '🛡️', description: '犯罪発生件数・種別、不審者情報', mvp: true },
  { id: 'hazard', name: '災害', nameEn: 'Hazard', icon: '⚠️', description: '洪水・土砂・液状化・津波・地盤リスク', mvp: true },
  { id: 'sound', name: '騒音', nameEn: 'Sound', icon: '🔊', description: '交通騒音、施設騒音、生活騒音', mvp: false },
  { id: 'community', name: 'コミュニティ', nameEn: 'Community', icon: '👥', description: '近隣トラブル、自治会、住民層', mvp: false },
  { id: 'change', name: '変化', nameEn: 'Change', icon: '📈', description: '地価推移、再開発、人口動態', mvp: false },
  { id: 'sensory', name: '五感', nameEn: 'Sensory', icon: '👃', description: '臭気、景観、日照、風通し', mvp: false },
  { id: 'vibe', name: '雰囲気', nameEn: 'Vibe', icon: '✨', description: '街の性格、雰囲気、住民の生の声', mvp: true },
] as const;

/** ノイズレイヤーの型 */
export type NoiseLayerId = typeof NOISE_LAYERS[number]['id'];
