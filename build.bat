@echo off
setlocal

cd /d "%~dp0"

set "PYTHON_EXE="

if exist "venv\Scripts\python.exe" (
    set "PYTHON_EXE=venv\Scripts\python.exe"
    call "venv\Scripts\activate.bat"
)

if not defined PYTHON_EXE if exist ".venv\Scripts\python.exe" (
    set "PYTHON_EXE=.venv\Scripts\python.exe"
    call ".venv\Scripts\activate.bat"
)

if not defined PYTHON_EXE (
    set "PYTHON_EXE=python"
)

echo [1/4] A instalar dependencias...
"%PYTHON_EXE%" -m pip install --upgrade pip
if errorlevel 1 goto :error

"%PYTHON_EXE%" -m pip install -r requirements.txt
if errorlevel 1 goto :error

echo [2/4] A gerar icone...
"%PYTHON_EXE%" create_icon.py
if errorlevel 1 goto :error

echo [3/4] A empacotar DevFlow.exe...
"%PYTHON_EXE%" -m PyInstaller --noconfirm --clean devflow.spec
if errorlevel 1 goto :error

echo [4/4] A copiar executavel para a raiz do projeto...
copy /Y "dist\DevFlow.exe" "DevFlow.exe" >nul
if errorlevel 1 goto :error

echo.
if exist ".env" (
    echo Credenciais detetadas em ".env".
    echo O ficheiro .env nao e embutido no executavel. Mantenha-o ao lado do DevFlow.exe ou use variaveis de ambiente do Windows.
) else (
    echo Aviso: ".env" nao encontrado.
    echo Crie um ficheiro .env ao lado do DevFlow.exe com SUPABASE_URL e SUPABASE_KEY.
    if exist ".env.example" (
        echo Pode usar ".env.example" como modelo.
    )
)

echo.
echo Build concluido com sucesso.
echo Executavel final: "%cd%\DevFlow.exe"
pause
exit /b 0

:error
echo.
echo O build falhou. Verifique as mensagens acima.
pause
exit /b 1
