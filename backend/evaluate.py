#!/usr/bin/env python3
"""Print held-out metrics from the trained InboxGuard model."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JSON_OUT = ROOT / "src" / "lib" / "ml" / "model.json"


def main() -> int:
    data = json.loads(JSON_OUT.read_text(encoding="utf-8"))
    m = data["metrics"]
    print("InboxGuard evaluation (held-out test set)")
    print(f"  dataset    {m['dataset']}")
    print(f"  n_train    {m['n_train']}")
    print(f"  n_test     {m['n_test']}")
    print(f"  features   {m['n_features']}")
    print(f"  accuracy   {m['accuracy']:.1%}")
    print(f"  F1         {m['f1']:.3f}")
    print(f"  precision  {m['precision']:.3f}")
    print(f"  recall     {m['recall']:.3f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
