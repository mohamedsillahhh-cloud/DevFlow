# -*- mode: python ; coding: utf-8 -*-

from __future__ import annotations

from pathlib import Path

import PyQt6

from PyInstaller.utils.hooks import collect_submodules, copy_metadata


PROJECT_ROOT = Path(SPECPATH).resolve()
ICON_PATH = PROJECT_ROOT / "assets" / "icons" / "devflow.ico"
PYQT_ROOT = Path(PyQt6.__file__).resolve().parent


def include_tree(source_dir: Path, target_dir: str) -> list[tuple[str, str]]:
    if not source_dir.exists():
        return []

    entries: list[tuple[str, str]] = []
    for path in source_dir.rglob("*"):
        if not path.is_file():
            continue
        relative_parent = path.relative_to(source_dir).parent
        destination = Path(target_dir) / relative_parent
        entries.append((str(path), str(destination)))
    return entries


def safe_copy_metadata(distribution_name: str) -> list[tuple[str, str]]:
    try:
        return copy_metadata(distribution_name)
    except Exception:
        return []

datas = []
datas += include_tree(PROJECT_ROOT / "assets", "assets")
datas += include_tree(PYQT_ROOT / "Qt6" / "plugins" / "platforms", "PyQt6/Qt6/plugins/platforms")
datas += include_tree(PYQT_ROOT / "Qt6" / "plugins" / "styles", "PyQt6/Qt6/plugins/styles")
datas += include_tree(PYQT_ROOT / "Qt6" / "plugins" / "imageformats", "PyQt6/Qt6/plugins/imageformats")
datas += safe_copy_metadata("supabase")
datas += safe_copy_metadata("postgrest")
datas += safe_copy_metadata("realtime")
datas += safe_copy_metadata("storage3")
datas += safe_copy_metadata("supabase-auth")
datas += safe_copy_metadata("supabase-functions")
datas += safe_copy_metadata("python-dotenv")

binaries = []
for dll_name in ("libEGL.dll", "libGLESv2.dll"):
    dll_path = PYQT_ROOT / "Qt6" / "bin" / dll_name
    if dll_path.exists():
        binaries.append((str(dll_path), "."))

hiddenimports = []
hiddenimports += [
    "PyQt6.QtCore",
    "PyQt6.QtGui",
    "PyQt6.QtWidgets",
    "PyQt6.sip",
    "dotenv",
    "dotenv.main",
    "httpx",
    "httpcore",
    "websockets",
    "yarl",
]
hiddenimports += collect_submodules("supabase")
hiddenimports += collect_submodules("postgrest")
hiddenimports += collect_submodules("realtime")
hiddenimports += collect_submodules("storage3")
hiddenimports += collect_submodules("supabase_auth")
hiddenimports += collect_submodules("supabase_functions")


a = Analysis(
    ["main.py"],
    pathex=[str(PROJECT_ROOT)],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        "sqlalchemy",
        "pysqlite2",
        "sqlite3",
        "_sqlite3",
    ],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="DevFlow",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=str(ICON_PATH),
)
