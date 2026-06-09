import os
import sys
import subprocess

def get_venv_python():
    # Check if .venv exists in the root
    if os.path.exists(".venv/Scripts/python.exe"):
        return os.path.abspath(".venv/Scripts/python.exe")
    elif os.path.exists(".venv/bin/python"):
        return os.path.abspath(".venv/bin/python")
    return sys.executable

def run_cmd(cmd):
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd)
    if result.returncode != 0:
        sys.exit(result.returncode)

if __name__ == "__main__":
    venv_python = get_venv_python()
    
    print("--- Running black formatter check ---")
    run_cmd([venv_python, "-m", "black", "--check", "api"])
    
    print("--- Running isort import sort check ---")
    run_cmd([venv_python, "-m", "isort", "--check-only", "api"])
    
    print("--- Running flake8 linter ---")
    run_cmd([venv_python, "-m", "flake8", "api"])
    
    print("--- Running mypy type checker ---")
    run_cmd([venv_python, "-m", "mypy", "api"])
    
    print("--- Running pytest regression suite ---")
    run_cmd([venv_python, "-m", "pytest", "api/tests", "-q"])
