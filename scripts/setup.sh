#!/bin/bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install node
/usr/local/python/bin/python3 -m venv ../
source ../bin/activate
cd ../src/back-end
npm i
npm install nodemailer
npm install jszip
cd RecmdSys
make install
cd ..
cd ../front-end/client/src
npm i
