-- Scenario 2: players with 30+ runs in at least 3 CONSECUTIVE matches (2024).
-- "Consecutive" = consecutive matches that player played (ordered by date).
-- Gaps-and-islands: number all of a player's matches (rn), number only the 30+ matches (qn);
-- rn - qn is constant inside an unbroken run of qualifying matches.
WITH ordered AS (
  SELECT player_name, match_date, runs,
         ROW_NUMBER() OVER (PARTITION BY player_name ORDER BY match_date) AS rn
  FROM ipl_batting
  WHERE season = 2024
),
qualifying AS (
  SELECT player_name, match_date, rn,
         rn - ROW_NUMBER() OVER (PARTITION BY player_name ORDER BY match_date) AS grp
  FROM ordered
  WHERE runs >= 30
)
SELECT player_name,
       MIN(match_date) AS streak_start_date,
       MAX(match_date) AS streak_end_date,
       COUNT(*)        AS streak_length
FROM qualifying
GROUP BY player_name, grp
HAVING COUNT(*) >= 3
ORDER BY player_name, streak_start_date;
