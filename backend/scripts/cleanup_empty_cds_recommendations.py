"""
One-time cleanup script for invalid CDS recommendation rows.

Deletes rows where all three are empty:
  - decisions
  - recommended_medications
  - recommended_tests

Usage:
  # Preview only (default)
  python scripts/cleanup_empty_cds_recommendations.py

  # Show up to 20 candidate rows
  python scripts/cleanup_empty_cds_recommendations.py --preview-limit 20

  # Apply deletion
  python scripts/cleanup_empty_cds_recommendations.py --apply
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from pathlib import Path
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

# Ensure backend root is importable when script is run directly.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


EMPTY_WHERE = """
(
  (decisions IS NULL OR decisions::text = '[]')
  AND (recommended_medications IS NULL OR recommended_medications::text = '[]')
  AND (recommended_tests IS NULL OR recommended_tests::text = '[]')
)
"""

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://auda:N1saw2Auda@localhost:5432/clinical_cds",
)

engine = create_async_engine(DATABASE_URL, future=True, pool_pre_ping=True)
async_session = async_sessionmaker(engine, expire_on_commit=False)


async def run_cleanup(apply: bool, preview_limit: int) -> None:
    async with async_session() as session:
        count_sql = text(f"SELECT COUNT(*) AS c FROM cds_recommendations WHERE {EMPTY_WHERE}")
        result = await session.execute(count_sql)
        total = int(result.scalar() or 0)
        print(f"[info] Empty recommendation rows found: {total}")

        if total == 0:
            return

        preview_sql = text(
            f"""
            SELECT id, visit_id, patient_id, created_at
            FROM cds_recommendations
            WHERE {EMPTY_WHERE}
            ORDER BY created_at DESC
            LIMIT :lim
            """
        )
        preview_rows = (await session.execute(preview_sql, {"lim": preview_limit})).mappings().all()

        print(f"[info] Preview (up to {preview_limit} rows):")
        for row in preview_rows:
            row_dict: dict[str, Any] = dict(row)
            print(
                f"  - id={row_dict.get('id')} "
                f"visit_id={row_dict.get('visit_id')} "
                f"patient_id={row_dict.get('patient_id')} "
                f"created_at={row_dict.get('created_at')}"
            )

        if not apply:
            print("[dry-run] No rows deleted. Re-run with --apply to delete.")
            return

        delete_sql = text(f"DELETE FROM cds_recommendations WHERE {EMPTY_WHERE}")
        await session.execute(delete_sql)
        await session.commit()
        print(f"[done] Deleted {total} empty recommendation row(s).")
    await engine.dispose()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Cleanup empty CDS recommendation rows")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually delete rows. Without this flag, script runs in dry-run mode.",
    )
    parser.add_argument(
        "--preview-limit",
        type=int,
        default=10,
        help="How many candidate rows to print in preview mode (default: 10).",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    asyncio.run(run_cleanup(apply=args.apply, preview_limit=args.preview_limit))
