#!/bin/sh
# Cria o banco de teste no container durante 1a exec
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v senha="${POSTGRES_TEST_PASSWORD:-pratocheio_test}" <<'EOSQL'
CREATE ROLE pratocheio_test LOGIN PASSWORD :'senha';
CREATE DATABASE pratocheio_test OWNER pratocheio_test;
DO $$
BEGIN
  EXECUTE format('REVOKE CONNECT ON DATABASE %I FROM PUBLIC', current_database());
END
$$;
EOSQL
