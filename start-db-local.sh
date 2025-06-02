#!/bin/bash


echo "🗄️  Starting db..."

docker run -d --name mysql-local -p 3307:3306 \
  -e MYSQL_ROOT_PASSWORD=pwd@123 \
  -e MYSQL_DATABASE=studentsdb \
  -e MYSQL_USER=admin \
  -e MYSQL_PASSWORD=pwd@123 \
  -v "$(pwd)/dbinit/init.sql:/docker-entrypoint-initdb.d/0_init.sql" \
  mysql:lts || echo "Database already running or failed to start"
