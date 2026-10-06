-- Scenario 1: quick "round-trip" transfers.
-- t1: A -> B. t2: B -> A, within 10% of t1's amount, after t1 and within 24 hours of it.
-- Written for SQLite (julianday). PostgreSQL: t2.txn_time > t1.txn_time AND t2.txn_time <= t1.txn_time + INTERVAL '24 hours'
--                                  MySQL:      t2.txn_time <= t1.txn_time + INTERVAL 24 HOUR
SELECT
  t1.txn_id                                         AS outbound_txn,
  t2.txn_id                                         AS return_txn,
  t1.from_account                                   AS account_a,
  t1.to_account                                     AS account_b,
  t1.amount                                         AS outbound_amount,
  t2.amount                                         AS return_amount,
  ROUND(ABS(t2.amount - t1.amount) * 100.0 / t1.amount, 2) AS pct_difference,
  ROUND((julianday(t2.txn_time) - julianday(t1.txn_time)) * 24, 2) AS hours_between
FROM transactions t1
JOIN transactions t2
  ON  t2.from_account = t1.to_account
  AND t2.to_account   = t1.from_account
  AND t2.txn_time     > t1.txn_time
  AND julianday(t2.txn_time) - julianday(t1.txn_time) <= 1.0          -- within 24h
  AND ABS(t2.amount - t1.amount) <= 0.10 * t1.amount                  -- within 10%
ORDER BY t1.txn_time;
