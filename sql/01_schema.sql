-- Scenario 1: account-to-account transfers
CREATE TABLE transactions (
  txn_id        INTEGER PRIMARY KEY,
  from_account  TEXT    NOT NULL,
  to_account    TEXT    NOT NULL,
  amount        NUMERIC NOT NULL CHECK (amount > 0),
  txn_time      TEXT    NOT NULL   -- 'YYYY-MM-DD HH:MM:SS' (TIMESTAMP in Postgres/MySQL)
);

-- Scenario 2: IPL-style batting scorecard rows (one row per player per match played)
CREATE TABLE ipl_batting (
  match_id     INTEGER NOT NULL,
  season       INTEGER NOT NULL,
  match_date   TEXT    NOT NULL,   -- DATE
  player_name  TEXT    NOT NULL,
  team         TEXT    NOT NULL,
  runs         INTEGER NOT NULL,
  PRIMARY KEY (match_id, player_name)
);
