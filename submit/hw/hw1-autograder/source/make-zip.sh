#!/usr/bin/sh

# problematic in that zip does not contain a top level directory

ZIP=autograder.zip

rm -f $ZIP

zip -r $ZIP . -x @.zipignore
