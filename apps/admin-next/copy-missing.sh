#!/bin/bash
SRC="/Volumes/MySSD/work/dev/lucky_nest_monorepo/apps/mini-shop-admin/src"
DEST="/Volumes/MySSD/work/dev/lucky_nest_monorepo/apps/admin-next/src"

mkdir -p "$DEST/schema"
mkdir -p "$DEST/consts"
mkdir -p "$DEST/hooks"

cp -r "$SRC/schema/." "$DEST/schema/"
cp -r "$SRC/consts/." "$DEST/consts/"
cp -r "$SRC/hooks/." "$DEST/hooks/"

echo "Done!"

