DO
$$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles WHERE rolname = 'insightpulse_ro'
   ) THEN
      CREATE ROLE insightpulse_ro LOGIN PASSWORD 'insightpulse_ro';
   END IF;
END
$$;

GRANT CONNECT ON DATABASE insightpulse TO insightpulse_ro;
GRANT USAGE ON SCHEMA public TO insightpulse_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO insightpulse_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO insightpulse_ro;
