-- シードデータ（開発用ダミーデータ）
-- TODO: 実際のデータパイプラインからインポート

INSERT INTO stations (name, name_en, location, municipality_code, municipality_name, lines) VALUES
  ('新宿', 'shinjuku', ST_Point(139.7003, 35.6896)::geography, '131041', '新宿区', ARRAY['JR山手線', 'JR中央線', '東京メトロ丸ノ内線', '都営大江戸線']),
  ('渋谷', 'shibuya', ST_Point(139.7016, 35.6580)::geography, '131130', '渋谷区', ARRAY['JR山手線', '東京メトロ銀座線', '東京メトロ半蔵門線', '東急東横線']),
  ('池袋', 'ikebukuro', ST_Point(139.7101, 35.7295)::geography, '131164', '豊島区', ARRAY['JR山手線', 'JR埼京線', '東京メトロ丸ノ内線', '東京メトロ有楽町線']);
