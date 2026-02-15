"""
Supabase Python クライアント
データパイプラインからのDB操作を共通化
"""

import logging
from typing import Any

from supabase import create_client, Client

from config.settings import SUPABASE_URL, SUPABASE_KEY

logger = logging.getLogger(__name__)


def get_client() -> Client:
    """Supabase クライアントを取得"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL と SUPABASE_KEY を環境変数に設定してください")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def upsert_records(table: str, records: list[dict[str, Any]], on_conflict: str = "id") -> int:
    """
    レコードを UPSERT（存在すれば更新、なければ挿入）

    Args:
        table: テーブル名
        records: 挿入するレコードのリスト
        on_conflict: 競合判定カラム

    Returns:
        処理件数
    """
    client = get_client()
    if not records:
        logger.warning("空のレコードリストが渡されました: %s", table)
        return 0

    result = client.table(table).upsert(records, on_conflict=on_conflict).execute()
    count = len(result.data) if result.data else 0
    logger.info("%s テーブルに %d 件を upsert しました", table, count)
    return count


def select_all(table: str, columns: str = "*") -> list[dict[str, Any]]:
    """
    テーブルの全レコードを取得（ページネーション対応）。

    Supabase のデフォルト制限（1,000行）を超えるテーブルも全件取得する。

    Args:
        table: テーブル名
        columns: 取得するカラム（デフォルト: すべて）

    Returns:
        レコードのリスト
    """
    client = get_client()
    all_data: list[dict[str, Any]] = []
    page_size = 1000
    offset = 0

    while True:
        result = (
            client.table(table)
            .select(columns)
            .range(offset, offset + page_size - 1)
            .execute()
        )
        rows = result.data or []
        all_data.extend(rows)
        if len(rows) < page_size:
            break
        offset += page_size

    return all_data


def insert_records(table: str, records: list[dict[str, Any]]) -> int:
    """
    レコードを INSERT

    Args:
        table: テーブル名
        records: 挿入するレコードのリスト

    Returns:
        処理件数
    """
    client = get_client()
    if not records:
        logger.warning("空のレコードリストが渡されました: %s", table)
        return 0

    result = client.table(table).insert(records).execute()
    count = len(result.data) if result.data else 0
    logger.info("%s テーブルに %d 件を insert しました", table, count)
    return count
