"""
設定ファイル
環境変数から各種APIキー・Supabase接続情報を読み込む
"""

import os
from dotenv import load_dotenv

# .env ファイルから環境変数を読み込み（プロジェクトルートの .env を参照）
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

# Supabase 接続情報
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# e-Stat API（政府統計の総合窓口）
ESTAT_API_KEY = os.getenv("ESTAT_API_KEY", "")

# 不動産情報ライブラリ API
REINFOLIB_API_KEY = os.getenv("REINFOLIB_API_KEY", "")

# データ保存先ディレクトリ
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

# 東京都の都道府県コード
TOKYO_PREFECTURE_CODE = "13"

# 駅周辺の検索半径（メートル）
STATION_RADIUS_M = 1000
