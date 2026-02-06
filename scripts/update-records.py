from __future__ import annotations

import json
import re
from datetime import date, datetime
from pathlib import Path

import pdfplumber

# --- Paths (edit these if your repo structure differs) ---
PDF_PATH = Path("assets/records/krhs-records.pdf")
JSON_OUT = Path("assets/data/records.json")
META_OUT = Path("assets/data/records-meta.json")

# Matches one record line: "<Event> <Time> <Date> <rest...>"
LINE_RE = re.compile(
    r"^(?P<event>.+?)\s+"
    r"(?P<time>(?:\d+:\d{2}\.\d{2}|\d{1,2}\.\d{2}))\s+"
    r"(?P<date>\d{1,2}-[A-Za-z]{3}-\d{2})\s+"
    r"(?P<rest>.+)$"
)

def season_from_date(dstr: str) -> str:
    # e.g. "15-Feb-19" -> "2019"
    dt = datetime.strptime(dstr, "%d-%b-%y").date()
    return str(dt.year)

def holder_from_rest(rest: str) -> str:
    # Keep only the left side before " at <meet name>"
    left = rest.split(" at ")[0].strip()

    # Strip leading team code patterns like "KRHS-" or "KTRN- VA"
    left = re.sub(r"^[A-Z]{3,4}-\s*", "", left).strip()
    left = re.sub(r"^VA\s+", "", left).strip()

    # Relays include the school name; your JSON stores only the swimmer list
    left = re.sub(r"^Kettle Run High School\s+", "", left).strip()

    return left

def parse_pdf(pdf_path: Path) -> list[dict]:
    records: list[dict] = []
    gender: str | None = None

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            for raw_line in text.splitlines():
                line = raw_line.strip()

                if line == "Yards-Female":
                    gender = "Female"
                    continue
                if line == "Yards-Male":
                    gender = "Male"
                    continue

                m = LINE_RE.match(line)
                if not m or not gender:
                    continue

                event = m.group("event").strip()
                record_time = m.group("time")
                record_date = m.group("date")
                rest = m.group("rest")

                records.append({
                    "Season": season_from_date(record_date),
                    "Course": "Yards",
                    "Gender": gender,
                    "Event": event,
                    "RecordTime": record_time,
                    "RecordDate": record_date,
                    "RecordHolder": holder_from_rest(rest),
                })

    # Optional safety check: you expect 22 total (11 girls + 11 boys)
    if len(records) != 22:
        raise ValueError(f"Expected 22 records (11 female + 11 male). Got {len(records)}.")

    return records

def write_meta():
    today = date.today()
    meta = {
        "lastUpdated": today.strftime("%Y-%m-%d"),
        "version": today.strftime("%Y%m%d"),
        "sourcePdf": str(PDF_PATH).replace("\\", "/"),
    }
    META_OUT.parent.mkdir(parents=True, exist_ok=True)
    META_OUT.write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    return meta

def main():
    if not PDF_PATH.exists():
        raise SystemExit(f"Missing PDF at: {PDF_PATH}")

    records = parse_pdf(PDF_PATH)

    JSON_OUT.parent.mkdir(parents=True, exist_ok=True)
    JSON_OUT.write_text(json.dumps(records, indent=2) + "\n", encoding="utf-8")

    meta = write_meta()

    print("Updated:")
    print(f" - {JSON_OUT}")
    print(f" - {META_OUT}")
    print(f"Records written: {len(records)}")
    print("Meta:", meta)

if __name__ == "__main__":
    main()
