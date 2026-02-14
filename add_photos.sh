#!/bin/bash
cd ~/Desktop/all_family-tree_finish
git add photos/avatars/*.jpg photos/gallery/*.jpg 2>/dev/null
git add -u photos/avatars/ photos/gallery/
git commit -m "Add/update photos $(date +%Y-%m-%d)" || true
git push
echo "✅ Photos updated!"
