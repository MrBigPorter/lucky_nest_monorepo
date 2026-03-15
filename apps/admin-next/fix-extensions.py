#!/usr/bin/env python3
import os
import re

DEST = "/Volumes/MySSD/work/dev/lucky_nest_monorepo/apps/admin-next/src"

for root, dirs, files in os.walk(DEST):
    for filename in files:
        if filename.endswith('.ts') or filename.endswith('.tsx'):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r') as f:
                content = f.read()
            orig = content
            # Remove .tsx from imports
            content = re.sub(r"(from\s+'[^']*?)\.tsx'", r"\1'", content)
            content = re.sub(r'(from\s+"[^"]*?)\.tsx"', r'\1"', content)
            # Remove .ts from imports (but not .tsx already handled)
            content = re.sub(r"(from\s+'[^']*?)\.ts'", r"\1'", content)
            content = re.sub(r'(from\s+"[^"]*?)\.ts"', r'\1"', content)
            if content != orig:
                with open(filepath, 'w') as f:
                    f.write(content)
                print(f"Fixed: {filepath.replace(DEST+'/','')}")

print("Done")

