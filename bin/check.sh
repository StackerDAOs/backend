#!/usr/bin/env bash

apt-get update
apt-get install -y unzip wget

wget https://github.com/hirosystems/clarinet/releases/download/v0.27.0/clarinet-linux-x64-glibc.tar.gz -O clarinet-linux-x64.zip
unzip clarinet-linux-x64.zip -d .
chmod +x ./clarinet
mv ./clarinet /usr/local/bin

clarinet check
