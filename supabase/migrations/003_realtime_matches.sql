-- Enable Supabase Realtime for the matches table so clients can subscribe to
-- score updates. The live-sync cron writes to this table, Postgres broadcasts
-- the row change, and any connected client hook re-renders instantly.
--
-- Free tier limits: 200 concurrent connections, 2M msgs/mo — plenty for ~800
-- users even during a high-profile match.

ALTER PUBLICATION supabase_realtime ADD TABLE matches;

-- REPLICA IDENTITY FULL is required for clients to receive the previous row
-- state on UPDATE events (useful for diffing scores). Slightly more WAL, but
-- `matches` is a small table and updates are bounded.
ALTER TABLE matches REPLICA IDENTITY FULL;
