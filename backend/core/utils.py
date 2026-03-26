import os
import sys

def get_base_path() -> str:
    """
    Get the absolute path to the application's root resource folder.

    Dynamically determines the root directory, correctly handling execution in both
    standard development environments and bundled PyInstaller executables (using `sys._MEIPASS`).

    Returns:
        str: The absolute path to the base directory.
    """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    return base_path

def get_tool_path(*paths: str) -> str:
    """
    Resolve a file path relative to the application's bundled 'tools' directory.

    Appends the provided path segments to the base directory's 'tools' folder, ensuring
    external executables or scripts (like llama.cpp) can be correctly located across platforms.

    Args:
        *paths (str): Variable number of string path segments (e.g., folder names, file name)
            to join relative to the 'tools' directory.

    Returns:
        str: The fully resolved absolute file path.
    """
    return os.path.join(get_base_path(), "tools", *paths)
