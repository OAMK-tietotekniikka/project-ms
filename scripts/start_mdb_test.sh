#!/bin/bash

docker stop mariadb-local-test 2>/dev/null || true
docker rm mariadb-local-test 2>/dev/null || true

echo "🗄️  Starting test MariaDB..."

docker run -d --name mariadb-local-test -p 3307:3306 \
  -e MARIADB_ROOT_PASSWORD=pwd@123 \
  -e MARIADB_DATABASE=project_ms_test \
  -e MARIADB_USER=admin \
  -e MARIADB_PASSWORD=pwd@123 \
  -v "$(pwd)/../dbinit/init_test.sql:/docker-entrypoint-initdb.d/init_test.sql" \
  mariadb:lts

echo "Waiting for MariaDB to be ready..."
sleep 10

echo "Done"