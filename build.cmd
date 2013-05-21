@echo off

call npm install

echo Building streamline _js files
call npm run-script build
