#!/usr/bin/env bash

groupadd students
useradd --no-user-group -g students student

mkdir -p /home/student
chown -R student:students /home/student

curl -fsSL https://deb.nodesource.com/setup_21.x | \
    bash - && apt-get install -y nodejs

npm install -g npm

pwd

SRC=/autograder/source

(cd $SRC/project; npm ci; npm run build)

if [ -e $SRC/project/setup.sh ]
then
    sh $SRC/project/setup.sh
fi
