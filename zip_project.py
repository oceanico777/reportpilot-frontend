import zipfile
import os

target_zip = r'c:\Users\USUARIO\.gemini\antigravity\brain\d8e8bba0-235d-4ca2-b76e-8ddeca525ac1\reportpilot_source_v2.zip'
base_dir = r'c:\Users\USUARIO\.gemini\antigravity\scratch\reportpilot_ai'

print(f"Zipping {base_dir} to {target_zip}")

with zipfile.ZipFile(target_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(base_dir):
        # Exclude directories
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', '__pycache__', 'venv', 'env', 'dist', 'build', '.vscode', '.idea']]
        
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, base_dir)
            try:
                zipf.write(file_path, arcname)
            except Exception as e:
                print(f"Skipping {file}: {e}")

print("SUCCESS: Zip created!")
