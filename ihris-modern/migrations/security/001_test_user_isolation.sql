-- ============================================================================
-- Sprint 5.5 — 001_test_user_isolation.sql
-- Creates a dedicated, least-privilege PostgreSQL login for integration tests
-- and prevents it from connecting to the production database (ihris_manage).
--
-- Run with psql and a password variable (never commit the real password):
--   psql -U ihris -d ihris_test_gap001 -v test_password='***' \
--        -f migrations/security/001_test_user_isolation.sql
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1) Create the test role if missing (no secret in this file).
SELECT 'CREATE ROLE ihris_test_user LOGIN'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ihris_test_user')\gexec

-- 2) Always (re)set the password from the psql variable.
SELECT format('ALTER ROLE ihris_test_user WITH LOGIN PASSWORD %L', :'test_password')\gexec

-- 3) Grant CONNECT on the test database ONLY.
GRANT CONNECT ON DATABASE ihris_test_gap001 TO ihris_test_user;

-- 4) Test database object privileges.
\connect ihris_test_gap001
GRANT USAGE ON SCHEMA public TO ihris_test_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ihris_test_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ihris_test_user;

-- 5) Future tables/sequences created by the owner (ihris) stay usable by tests.
ALTER DEFAULT PRIVILEGES FOR ROLE ihris IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ihris_test_user;
ALTER DEFAULT PRIVILEGES FOR ROLE ihris IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO ihris_test_user;

-- 6) Deny connection to production for every role not explicitly allowed.
--    PostgreSQL grants CONNECT to PUBLIC by default, so an explicit revoke is
--    required for "connection refused". Existing login roles keep their access.
REVOKE CONNECT ON DATABASE ihris_manage FROM PUBLIC;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT rolname
    FROM pg_roles
    WHERE rolcanlogin AND rolname <> 'ihris_test_user'
  LOOP
    EXECUTE format('GRANT CONNECT ON DATABASE ihris_manage TO %I', r.rolname);
  END LOOP;
END $$;

-- 7) Explicitly ensure the test user has NO connect privilege on production.
REVOKE CONNECT ON DATABASE ihris_manage FROM ihris_test_user;

-- Verification queries (run manually):
--   SELECT has_database_privilege('ihris_test_user','ihris_test_gap001','CONNECT'); -- t
--   SELECT has_database_privilege('ihris_test_user','ihris_manage','CONNECT');      -- f
