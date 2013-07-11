@echo off

setlocal

set GIT_STATUS_RETURN_VALUE=

echo Make sure no outstanding files to commit
FOR /F "tokens=*" %%i IN ('git status -z') DO (
  set GIT_STATUS_RETURN_VALUE=%%i
)

if NOT "%GIT_STATUS_RETURN_VALUE%" == "" (
  git status
  goto error
)

echo Building kuduscript
call build.cmd

echo Testing kuduscript
call npm test
IF %ERRORLEVEL% NEQ 0 goto error

echo Incrementing kuduscript version
call npm version patch
IF %ERRORLEVEL% NEQ 0 goto error

echo Trying to install kuduscript
call npm install . -g
IF %ERRORLEVEL% NEQ 0 goto error

echo Publishing kuduscript
call npm publish
IF %ERRORLEVEL% NEQ 0 goto error

echo Trying to install kuduscript from npm registry
call npm install kuduscript -g
IF %ERRORLEVEL% NEQ 0 goto error

goto end

:error
echo Publishing kuduscript failed
exit /b 1

:end
echo Published successfully
