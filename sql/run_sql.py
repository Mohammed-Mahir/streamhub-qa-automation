"""Builds an in-memory SQLite DB from schema+seed, runs both scenarios, prints and saves results."""
import sqlite3, pathlib

base = pathlib.Path(__file__).parent
con = sqlite3.connect(":memory:")
for f in ("01_schema.sql", "02_seed.sql"):
    con.executescript((base / f).read_text())

def run(name, file):
    cur = con.execute((base / file).read_text())
    cols = [d[0] for d in cur.description]
    rows = cur.fetchall()
    widths = [max(len(str(x)) for x in [c] + [r[i] for r in rows]) for i, c in enumerate(cols)]
    line = lambda vals: " | ".join(str(v).ljust(w) for v, w in zip(vals, widths))
    out = [f"== {name} ==", line(cols), "-+-".join("-" * w for w in widths)] + [line(r) for r in rows]
    out.append(f"({len(rows)} rows)")
    text = "\n".join(out)
    print(text + "\n")
    (base / "results" / f"{file.replace('.sql', '')}.txt").write_text(text + "\n")

run("Scenario 1 - round-trip transfers", "scenario1_round_trip.sql")
run("Scenario 2 - IPL 30+ run streaks", "scenario2_streaks.sql")
