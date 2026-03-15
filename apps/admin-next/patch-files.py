#!/usr/bin/env python3
import os
import re

DEST = "/Volumes/MySSD/work/dev/lucky_nest_monorepo/apps/admin-next/src"

# Files that are React components (need 'use client')
COMPONENT_DIRS = [
    "pages",
    "components",
]

# Files that are pure TS (store, api, type) - no 'use client' but need env var fixes
ALL_TS_FILES = []

def get_all_ts_files(directory):
    files = []
    for root, dirs, filenames in os.walk(directory):
        for filename in filenames:
            if filename.endswith('.ts') or filename.endswith('.tsx'):
                files.append(os.path.join(root, filename))
    return files

all_files = get_all_ts_files(DEST)

for filepath in all_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. Fix env vars: import.meta.env.VITE_API_BASE_URL -> process.env.NEXT_PUBLIC_API_BASE_URL
    content = content.replace(
        "import.meta.env.VITE_API_BASE_URL",
        "process.env.NEXT_PUBLIC_API_BASE_URL"
    )
    # 2. Fix DEV flag
    content = content.replace(
        "import.meta.env.DEV",
        "process.env.NODE_ENV === 'development'"
    )

    # 3. Fix useNavigate -> useRouter (next/navigation)
    content = content.replace(
        "import { useNavigate } from 'react-router-dom'",
        "import { useRouter } from 'next/navigation'"
    )
    content = content.replace(
        "import { useNavigate, useLocation } from 'react-router-dom'",
        "import { useRouter, usePathname } from 'next/navigation'"
    )
    content = content.replace(
        "import { useLocation, useNavigate } from 'react-router-dom'",
        "import { useRouter, usePathname } from 'next/navigation'"
    )
    content = content.replace(
        "const navigate = useNavigate()",
        "const router = useRouter()"
    )
    content = content.replace(
        "navigate('",
        "router.push('"
    )
    content = content.replace(
        'navigate("',
        'router.push("'
    )
    content = content.replace(
        "navigate(`",
        "router.push(`"
    )

    # 4. Fix .ts extension imports (Next.js doesn't like .ts/.tsx in imports)
    content = re.sub(r"from '(.*?)\.tsx'", r"from '\1'", content)
    content = re.sub(r"from '(.*?)\.ts'", r"from '\1'", content)

    # 5. Add 'use client' to .tsx files in pages/ and components/ that use hooks
    # (Only add if not already present)
    if filepath.endswith('.tsx'):
        rel_path = filepath.replace(DEST + '/', '')
        needs_client = any(rel_path.startswith(d) for d in COMPONENT_DIRS)
        if needs_client and not content.startswith("'use client'"):
            content = "'use client';\n\n" + content

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath.replace(DEST+'/', '')}")

print("Done!")

