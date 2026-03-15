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
            # Replace @/pages/ with @/views/
            content = content.replace("from '@/pages/", "from '@/views/")
            content = content.replace('from "@/pages/', 'from "@/views/')
            # Also fix any relative imports of pages
            content = content.replace("'../pages/", "'../views/")
            content = content.replace('"../pages/', '"../views/')
            content = content.replace("'./pages/", "'./views/")
            if content != orig:
                with open(filepath, 'w') as f:
                    f.write(content)
                print(f"Updated: {filepath.replace(DEST+'/','')}")

print("Done")

