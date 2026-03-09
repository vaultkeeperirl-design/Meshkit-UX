import os
import sys

def get_base_path():
    """Get the absolute path to the resource, works for dev and for PyInstaller."""
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    return base_path

def get_tool_path(*paths):
    """Resolve a path relative to the bundled tools directory."""
    return os.path.join(get_base_path(), "tools", *paths)
