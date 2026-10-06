-- Scenario 1 sample data
INSERT INTO transactions VALUES
 (1, 'A', 'B', 1000, '2024-05-01 10:00:00'),
 (2, 'B', 'A',  950, '2024-05-01 18:00:00'),  -- match: 5% lower, 8h later
 (3, 'A', 'C',  500, '2024-05-02 09:00:00'),
 (4, 'C', 'A',  520, '2024-05-03 12:00:00'),  -- amount ok but 51h later -> NO
 (5, 'B', 'C', 2000, '2024-05-04 08:00:00'),
 (6, 'C', 'B', 1500, '2024-05-04 09:00:00'),  -- 25% lower -> NO
 (7, 'D', 'E',  100, '2024-05-05 10:00:00'),
 (8, 'E', 'D',  109, '2024-05-05 11:00:00'),  -- match: 9% higher, 1h later
 (9, 'F', 'G',  300, '2024-05-06 10:00:00'),
 (10,'G', 'F',  330, '2024-05-07 10:00:00'),  -- exactly 10% and exactly 24h -> match (inclusive)
 (11,'H', 'I',  800, '2024-05-08 10:00:00'),
 (12,'I', 'H',  800, '2024-05-08 09:00:00');  -- earlier than txn 11, so I->H (12) then H->I (11) 1h later IS a round trip (txn 11 is not an outbound match)

-- Scenario 2 sample data (synthetic players, 2024 season)
INSERT INTO ipl_batting VALUES
 -- Ravi Menon: 45,52,31 then 12 then 60 -> one streak of 3 starting 2024-03-23
 (1,2024,'2024-03-23','Ravi Menon','CSK',45), (5,2024,'2024-03-27','Ravi Menon','CSK',52),
 (9,2024,'2024-04-01','Ravi Menon','CSK',31), (13,2024,'2024-04-05','Ravi Menon','CSK',12),
 (17,2024,'2024-04-09','Ravi Menon','CSK',60),
 -- Karan Shetty: only 2 in a row -> not returned
 (2,2024,'2024-04-02','Karan Shetty','MI',40), (6,2024,'2024-04-06','Karan Shetty','MI',35),
 (10,2024,'2024-04-10','Karan Shetty','MI',18), (14,2024,'2024-04-14','Karan Shetty','MI',33),
 -- Imran Qureshi: 30 is inclusive. Streak of 4 (from 04-01) and a later streak of 3 (from 04-20)
 (3,2024,'2024-04-01','Imran Qureshi','RCB',30), (7,2024,'2024-04-04','Imran Qureshi','RCB',30),
 (11,2024,'2024-04-08','Imran Qureshi','RCB',30), (15,2024,'2024-04-12','Imran Qureshi','RCB',30),
 (19,2024,'2024-04-16','Imran Qureshi','RCB',8),  (23,2024,'2024-04-20','Imran Qureshi','RCB',35),
 (27,2024,'2024-04-24','Imran Qureshi','RCB',41), (31,2024,'2024-04-28','Imran Qureshi','RCB',55),
 -- Sanjay Iyer: 29 breaks the run -> only 2 qualifying in a row
 (4,2024,'2024-05-01','Sanjay Iyer','KKR',29), (8,2024,'2024-05-05','Sanjay Iyer','KKR',30),
 (12,2024,'2024-05-09','Sanjay Iyer','KKR',31),
 -- Dev Patil: 3 qualifying matches but a 5-run innings sits between -> no streak
 (16,2024,'2024-05-10','Dev Patil','DC',50), (20,2024,'2024-05-14','Dev Patil','DC',5),
 (24,2024,'2024-05-18','Dev Patil','DC',45), (28,2024,'2024-05-22','Dev Patil','DC',60),
 -- Previous season row: must be ignored
 (101,2023,'2023-04-01','Karan Shetty','MI',99), (102,2023,'2023-04-05','Karan Shetty','MI',99),
 (103,2023,'2023-04-09','Karan Shetty','MI',99);
