#!/usr/bin/sh

#cwd = /autograder

SRC=`pwd`/source

cd submission

SRC=$SRC node $SRC/project/dist/index.js  $SRC/project/dist/grading/*.js

echo "*** Running hw1-sol.ts ***"
echo
echo
ts-node hw1-sol/hw1-sol.ts

