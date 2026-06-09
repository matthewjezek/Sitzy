import sys
import subprocess
import os

def run_cmd(cmd, cwd=None):
    print(f"Running: {' '.join(cmd)} in {cwd or '.'}")
    # Use shell=True on Windows since npm is a cmd wrapper
    shell = sys.platform == "win32"
    result = subprocess.run(cmd, cwd=cwd, shell=shell)
    if result.returncode != 0:
        sys.exit(result.returncode)

if __name__ == "__main__":
    run_cmd(["npm", "run", "pre-commit"], cwd="frontend")
