@echo off
setlocal EnableDelayedExpansion

:: Directory containing SVG files (current directory by default)
set "DIRECTORY=%CD%"

:: Check if Inkscape is installed
where inkscape >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Inkscape is not installed or not in PATH. Please install it first.
    exit /b 1
)

:: Process all SVG files in the directory
for %%F in ("%DIRECTORY%\*.svg") do (
    echo Processing: %%F
    "inkscape" ^
        --actions="select-all;remove-style;object-set-attribute:fill,#168acd;object-set-attribute:fill-opacity,1;export-filename:%%F;export-do" ^
        "%%F"
    if !ERRORLEVEL! equ 0 (
        echo Successfully modified: %%F
    ) else (
        echo Error processing: %%F
    )
)

echo Processing complete!
pause