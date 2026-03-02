const hint = document.getElementById('hintText');
const debugEl = document.getElementById('debug');
const photoInput = document.getElementById('photoInput');
const resetTintBtn = document.getElementById('resetTint');

const characterEl = document.getElementById('character');
const fallbackGeom = document.getElementById('fallbackGeom');

let originalMaterials = null;
let lastTint = null;

function logDebug(msg) { debugEl.textContent = msg || ''; }
function setHint(msg) { hint.textContent = msg; }

function isModelLoaded(el) { return !!el.getObject3D('mesh'); }

function collectMaterials(object3D) {
  const mats = [];
  object3D.traverse((node) => {
    if (node.isMesh && node.material) {
      if (Array.isArray(node.material)) mats.push(...node.material);
      else mats.push(node.material);
    }
  });
  return Array.from(new Set(mats));
}

function snapshotOriginalMaterials(mats) {
  return mats.map(m => ({
    m,
    color: m.color ? m.color.clone() : null,
    emissive: m.emissive ? m.emissive.clone() : null,
  }));
}

function restoreOriginalMaterials() {
  if (!originalMaterials) return;
  for (const entry of originalMaterials) {
    if (entry.color && entry.m.color) entry.m.color.copy(entry.color);
    if (entry.emissive && entry.m.emissive) entry.m.emissive.copy(entry.emissive);
    entry.m.needsUpdate = true;
  }
  lastTint = null;
  setHint('Colors reset. Point your camera at the coloring page.');
}

function applyTint(hexColor) {
  const mesh = characterEl.getObject3D('mesh');
  if (!mesh) {
    fallbackGeom.setAttribute('visible', true);
    const obj = fallbackGeom.object3D;
    obj.traverse((node) => {
      if (node.isMesh && node.material && node.material.color) {
        node.material.color.set(hexColor);
        node.material.needsUpdate = true;
      }
    });
    lastTint = hexColor;
    setHint('Tint applied (placeholder).');
    return;
  }

  const mats = collectMaterials(mesh);
  if (!originalMaterials) originalMaterials = snapshotOriginalMaterials(mats);

  // Simple blend: 70% original + 30% tint
  mats.forEach(m => {
    if (m.color) {
      const orig = m.color.clone();
      const tint = orig.clone().set(hexColor);
      orig.lerp(tint, 0.30);
      m.color.copy(orig);
    }
    if (m.emissive) {
      const e = m.emissive.clone().set(hexColor);
      m.emissive.lerp(e, 0.15);
    }
    m.needsUpdate = true;
  });

  lastTint = hexColor;
  setHint('Nice! Your drawing color was applied.');
}

async function getAverageColorFromImage(file) {
  const img = new Image();
  const url = URL.createObjectURL(file);
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const maxSide = 200;
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  canvas.width = Math.max(1, Math.floor(img.width * scale));
  canvas.height = Math.max(1, Math.floor(img.height * scale));
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  let r=0, g=0, b=0, count=0;
  for (let i=0; i<data.length; i+=4) {
    const rr = data[i], gg = data[i+1], bb = data[i+2], aa = data[i+3];
    if (aa < 30) continue;
    // ignore paper/near-white
    if (rr > 240 && gg > 240 && bb > 240) continue;
    r += rr; g += gg; b += bb;
    count++;
  }
  URL.revokeObjectURL(url);

  if (!count) return '#4cc9f0';

  r = Math.round(r / count);
  g = Math.round(g / count);
  b = Math.round(b / count);

  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

function wireTargetEvents() {
  const anchor = document.getElementById('anchor');
  anchor.addEventListener('targetFound', () => {
    setHint('Target found! Your character is here 🎉');
    logDebug(lastTint ? `Tint: ${lastTint}` : '');
  });
  anchor.addEventListener('targetLost', () => {
    setHint('Move closer / hold steady on the coloring page.');
  });
}

async function checkCriticalFiles() {
  // This prevents the "mystery black screen" problem by telling you what's missing.
  try {
    const r = await fetch('/targets/targets.mind', { cache: 'no-store' });
    if (!r.ok) {
      setHint('Missing targets file. Make sure /targets/targets.mind exists on your site.');
      logDebug('Fix: re-upload so this link works: https://YOUR-SITE/targets/targets.mind');
      return false;
    }
  } catch (e) {
    setHint('Could not load targets file. Check your internet / hosting.');
    logDebug(String(e));
    return false;
  }
  return true;
}

function checkModelOrFallback() {
  setTimeout(() => {
    if (!isModelLoaded(characterEl)) {
      fallbackGeom.setAttribute('visible', true);
      setHint('Model not found. Add /assets/character.glb to replace the placeholder.');
      logDebug('Fix: upload character.glb so this works: https://YOUR-SITE/assets/character.glb');
    }
  }, 5000);
}

photoInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setHint('Analyzing colors from your photo…');
  try {
    const hex = await getAverageColorFromImage(file);
    applyTint(hex);
    logDebug(`Applied color: ${hex}`);
  } catch (err) {
    console.error(err);
    setHint('Could not read that photo. Try a clearer picture.');
  }
});

resetTintBtn.addEventListener('click', restoreOriginalMaterials);

window.addEventListener('DOMContentLoaded', async () => {
  setHint('Checking files…');
  const ok = await checkCriticalFiles();
  if (ok) {
    setHint('Point your camera at the coloring page.');
    wireTargetEvents();
    checkModelOrFallback();
  }
});
