-- stations テーブルに lat/lng カラム追加（RPC・フロントエンドが参照するが未定義だった）
ALTER TABLE stations ADD COLUMN IF NOT EXISTS lat NUMERIC;
ALTER TABLE stations ADD COLUMN IF NOT EXISTS lng NUMERIC;
