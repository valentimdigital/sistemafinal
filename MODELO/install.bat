@echo off
echo Instalando dependencias do projeto principal...
"C:\Program Files\nodejs\npm" install

echo.
echo Instalando dependencias do backend...
cd backend
"C:\Program Files\nodejs\npm" install
cd ..

echo.
echo Instalando dependencias do frontend...
cd frontend
"C:\Program Files\nodejs\npm" install
cd ..

echo.
echo Instalando dependencias do dashboard...
cd dashboard
"C:\Program Files\nodejs\npm" install
cd ..

echo.
echo Todas as dependencias foram instaladas!
pause 