#!/usr/bin/env python3
"""クラウド Supabase → ローカル Supabase データ移行スクリプト"""

import os
import sys
import httpx
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# .env を読み込み
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

CLOUD_URL = os.environ['NEXT_PUBLIC_SUPABASE_URL']
SERVICE_KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']
LOCAL_DSN = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

# FK 依存順に定義（カラムリストはクラウドスキーマに合わせる）
TABLES = [
    {
        'name': 'stations',
        'columns': [
            'id', 'name', 'name_en', 'municipality_code', 'municipality_name',
            'lines', 'created_at', 'lat', 'lng',
        ],
    },
    {
        'name': 'safety_scores',
        'columns': [
            'id', 'station_id', 'year', 'total_crimes',
            'crimes_violent', 'crimes_assault', 'crimes_theft',
            'crimes_intellectual', 'crimes_other',
            'score', 'rank', 'previous_year_total', 'updated_at',
        ],
    },
    {
        'name': 'areas',
        'columns': [
            'id', 'area_name', 'area_name_en', 'municipality_code',
            'municipality_name', 'key_code', 'lat', 'lng',
            'centroid', 'boundary', 'geojson', 'created_at', 'updated_at',
        ],
    },
    {
        'name': 'area_vibe_data',
        'columns': [
            'id', 'area_name', 'population_young_ratio', 'population_family_ratio',
            'population_elderly_ratio', 'daytime_population_ratio',
            'single_household_ratio', 'restaurant_count', 'convenience_store_count',
            'park_count', 'school_count', 'hospital_count', 'tags', 'updated_at',
        ],
    },
    {
        'name': 'town_crimes',
        'columns': [
            'id', 'area_name', 'municipality_code', 'municipality_name',
            'year', 'total_crimes', 'crimes_violent', 'crimes_assault',
            'crimes_theft', 'crimes_intellectual', 'crimes_other',
            'name_en', 'score', 'rank', 'lat', 'lng',
        ],
    },
]

PAGE_SIZE = 1000


def fetch_all_rows(table_name: str, columns: list[str]) -> list[dict]:
    """クラウド REST API からページネーションで全行取得"""
    select = ','.join(columns)
    all_rows = []
    offset = 0

    with httpx.Client(timeout=60) as client:
        while True:
            url = f"{CLOUD_URL}/rest/v1/{table_name}?select={select}&order=id&offset={offset}&limit={PAGE_SIZE}"
            resp = client.get(url, headers={
                'apikey': SERVICE_KEY,
                'Authorization': f'Bearer {SERVICE_KEY}',
            })
            resp.raise_for_status()
            rows = resp.json()
            if not rows:
                break
            all_rows.extend(rows)
            print(f"  fetched {len(all_rows)} rows...", end='\r')
            if len(rows) < PAGE_SIZE:
                break
            offset += PAGE_SIZE

    print(f"  fetched {len(all_rows)} rows total")
    return all_rows


def insert_rows(conn, table_name: str, columns: list[str], rows: list[dict]):
    """ローカル DB にバッチ INSERT"""
    if not rows:
        return

    col_list = ', '.join(columns)
    placeholders = ', '.join([f'%({c})s' for c in columns])
    sql = f"INSERT INTO {table_name} ({col_list}) VALUES ({placeholders})"

    with conn.cursor() as cur:
        # TRUNCATE してから INSERT（冪等性）
        cur.execute(f"TRUNCATE {table_name} CASCADE")

        # バッチ INSERT（1000行ずつ）
        batch_size = 1000
        for i in range(0, len(rows), batch_size):
            batch = rows[i:i + batch_size]
            psycopg2.extras.execute_batch(cur, sql, batch)
            print(f"  inserted {min(i + batch_size, len(rows))}/{len(rows)} rows...", end='\r')

    conn.commit()
    print(f"  inserted {len(rows)} rows total")


def verify_counts(conn, expected: dict[str, int]):
    """行数を検証"""
    print("\n=== 検証 ===")
    with conn.cursor() as cur:
        all_ok = True
        for table_name, expected_count in expected.items():
            cur.execute(f"SELECT count(*) FROM {table_name}")
            actual = cur.fetchone()[0]
            status = "OK" if actual == expected_count else "MISMATCH"
            if status == "MISMATCH":
                all_ok = False
            print(f"  {table_name}: {actual}/{expected_count} {status}")
        return all_ok


def main():
    print(f"Cloud: {CLOUD_URL}")
    print(f"Local: {LOCAL_DSN}\n")

    conn = psycopg2.connect(LOCAL_DSN)
    expected_counts = {}

    try:
        for table_config in TABLES:
            table_name = table_config['name']
            columns = table_config['columns']

            print(f"\n--- {table_name} ---")
            rows = fetch_all_rows(table_name, columns)
            expected_counts[table_name] = len(rows)

            if rows:
                insert_rows(conn, table_name, columns, rows)
            else:
                print("  skipped (0 rows)")

        ok = verify_counts(conn, expected_counts)
        if ok:
            print("\n全テーブル移行完了!")
        else:
            print("\n一部テーブルでカウント不一致あり", file=sys.stderr)
            sys.exit(1)

    finally:
        conn.close()


if __name__ == '__main__':
    main()
