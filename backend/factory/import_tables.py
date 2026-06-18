"""
Dump each fact_app model from local MySQL and load into Render Postgres.
Run from backend/factory with DATABASE_URL set to the external Render Postgres URL.

Usage:
  $env:DATABASE_URL="postgresql://..."
  python import_tables.py
"""
import os
import subprocess
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
FIXTURES_DIR = BASE_DIR / "fixtures"
PYTHON = sys.executable

# Dependency order (Employee may already exist in Postgres).
MODELS = [
    "fact_app.Vendor",
    "fact_app.RawMaterial",
    "fact_app.Customer",
    "fact_app.Product",
    "fact_app.ProductRawMaterial",
    "fact_app.Order",
    "fact_app.OrderDetails",
    "fact_app.Billing",
    "fact_app.ExpenseCategory",
    "fact_app.Expense",
]

POSTGRES_URL = os.environ.get("DATABASE_URL")
if not POSTGRES_URL:
    print("ERROR: Set DATABASE_URL to your Render external Postgres URL first.")
    sys.exit(1)


def run(cmd, env=None):
    print(f"\n>>> {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=BASE_DIR, env=env)
    if result.returncode != 0:
        raise SystemExit(result.returncode)


def dump_model(model: str, path: Path):
    env = os.environ.copy()
    env.pop("DATABASE_URL", None)
    with path.open("w", encoding="utf-8", newline="\n") as f:
        proc = subprocess.run(
            [PYTHON, "manage.py", "dumpdata", model, "--indent", "2"],
            cwd=BASE_DIR,
            env=env,
            stdout=f,
            stderr=subprocess.PIPE,
            text=True,
        )
    if proc.returncode != 0:
        print(proc.stderr)
        raise SystemExit(proc.returncode)
    print(f"Dumped {model} -> {path.name} ({path.stat().st_size} bytes)")


def load_fixture(path: Path):
    env = os.environ.copy()
    env["DATABASE_URL"] = POSTGRES_URL
    run([PYTHON, "manage.py", "loaddata", str(path), "-v", "2"], env=env)


def main():
    FIXTURES_DIR.mkdir(exist_ok=True)
    print("Importing tables one-by-one into Render Postgres...")

    for model in MODELS:
        slug = model.split(".")[-1].lower()
        fixture = FIXTURES_DIR / f"{slug}.json"
        print(f"\n=== {model} ===")
        dump_model(model, fixture)
        load_fixture(fixture)

    print("\nDone. Verify: https://factory-project-backend.onrender.com/api/db-health/")


if __name__ == "__main__":
    main()
