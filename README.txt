MAGIC COLORING AR (v2) — DOWNLOAD + UPLOAD CORRECTLY

This is your self-hosted WebAR site:
QR code -> opens website -> point camera at the coloring page -> a 3D character appears anchored to the page.

WHAT YOU MUST ADD
1) MindAR image target file:
   - Put it here: targets/targets.mind

2) 3D model (GLB):
   - Put it here: assets/character.glb

IMPORTANT: UPLOAD THE *CONTENTS* OF THIS FOLDER
When you deploy to Netlify, upload these items directly:
  index.html
  main.js
  assets/   (folder)
  targets/  (folder)
Do NOT upload a wrapper folder that contains them, or your links will 404.

QUICK TEST AFTER DEPLOY
Open these links on your phone:
  https://YOUR-SITE/targets/targets.mind   (must NOT be 404)
  https://YOUR-SITE/assets/character.glb   (must NOT be 404; optional)

IF YOU SEE A BLACK SCREEN
Almost always: targets.mind is missing or 404.
This v2 project shows an on-screen message telling you exactly what's missing.

HOW TO CREATE targets.mind
Use a MindAR Image Target Compiler (online):
- Upload your worksheet image (or just the character area).
- Download the .mind file
- Rename it to targets.mind
- Put it in the targets/ folder

DEPLOY (Netlify Drop)
1) Unzip the zip file.
2) Open the folder.
3) Select: index.html, main.js, assets, targets
4) Drag those into https://app.netlify.com/drop
