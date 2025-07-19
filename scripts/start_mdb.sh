#!/bin/bash

docker stop mariadb-local 2>/dev/null || true
docker rm mariadb-local 2>/dev/null || true

echo "🗄️  Starting MariaDB..."

docker run -d --name mariadb-local -p 3307:3306 \
  -e MARIADB_ROOT_PASSWORD=pwd@123 \
  -e MARIADB_DATABASE=project_ms \
  -e MARIADB_USER=admin \
  -e MARIADB_PASSWORD=pwd@123 \
  -v "$(pwd)/dbinit/init.sql:/docker-entrypoint-initdb.d/init.sql" \
  mariadb:lts

echo "Waiting for MariaDB to be ready..."
sleep 10

echo "Done"