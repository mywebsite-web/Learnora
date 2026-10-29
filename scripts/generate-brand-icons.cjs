const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function getAppIconSvg(isMaskable = false) {
  // For maskable icon: scale to 0.78 and center so Android round/squircle icon masks don't clip the emblem
  const scale = isMaskable ? 0.78 : 1.0;
  const translate = isMaskable ? (512 * (1 - scale)) / 2 : 0;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Background Gradient: Deep Forest Pine Green matching user brand presentation -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#083827" />
      <stop offset="50%" stop-color="#052E20" />
      <stop offset="100%" stop-color="#032217" />
    </linearGradient>

    <!-- Subtle radial depth glow -->
    <radialGradient id="centerGlow" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#0E4833" stop-opacity="0.7" />
      <stop offset="60%" stop-color="#052E20" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#032217" stop-opacity="0" />
    </radialGradient>

    <!-- Left Wing Face Gradient -->
    <linearGradient id="leftPageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D1FAE5" />
      <stop offset="20%" stop-color="#6EE7B7" />
      <stop offset="65%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>

    <!-- Right Wing Face Gradient -->
    <linearGradient id="rightPageGrad" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#D1FAE5" />
      <stop offset="20%" stop-color="#6EE7B7" />
      <stop offset="65%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>

    <!-- Inner 3D Highlight Sheen Left -->
    <linearGradient id="leftSheen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.8" />
      <stop offset="40%" stop-color="#A7F3D0" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#10B981" stop-opacity="0" />
    </linearGradient>

    <!-- Inner 3D Highlight Sheen Right -->
    <linearGradient id="rightSheen" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.8" />
      <stop offset="40%" stop-color="#A7F3D0" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#10B981" stop-opacity="0" />
    </linearGradient>
  </defs>

  <!-- Background Squircle / Square -->
  ${isMaskable 
    ? `<rect width="512" height="512" fill="url(#bgGrad)" />
       <rect width="512" height="512" fill="url(#centerGlow)" />` 
    : `<rect width="512" height="512" rx="116" fill="url(#bgGrad)" />
       <rect width="512" height="512" rx="116" fill="url(#centerGlow)" />
       <rect x="5" y="5" width="502" height="502" rx="111" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="2" />`
  }

  <g transform="translate(${translate}, ${translate}) scale(${scale})">
    
    <!-- ========================================== -->
    <!-- OPEN BOOK / SPROUTING LEAF PAGES           -->
    <!-- ========================================== -->
    
    <!-- Central Connector Stem -->
    <path d="M252 248 L260 248 L258 290 L254 290 Z" fill="#052E20" />

    <!-- LEFT PAGE -->
    <!-- Left Page Outer Silhouette & Main Gradient -->
    <path d="M124 192 
             L124 306 
             C124 346 164 384 250 408 
             L252 268 
             C212 244 168 218 124 192 Z" 
          fill="url(#leftPageGrad)" />

    <!-- Left Page Inner Luminous 3D Highlight Layer -->
    <path d="M138 200 
             L138 298 
             C138 332 172 368 250 398 
             L250 274 
             C214 252 176 226 138 200 Z" 
          fill="url(#leftSheen)" />

    <!-- Left Page Top Rim Highlight -->
    <path d="M124 192 L252 268" 
          fill="none"
          stroke="#FFFFFF" 
          stroke-width="2.5" 
          stroke-linecap="round" 
          opacity="0.6" />

    <!-- Left Page Outer Edge Highlight -->
    <path d="M124 192 L124 306 C124 346 164 384 250 408" 
          fill="none" 
          stroke="rgba(255, 255, 255, 0.25)" 
          stroke-width="2" />

    <!-- RIGHT PAGE -->
    <!-- Right Page Outer Silhouette & Main Gradient -->
    <path d="M388 192 
             L388 306 
             C388 346 348 384 262 408 
             L260 268 
             C300 244 344 218 388 192 Z" 
          fill="url(#rightPageGrad)" />

    <!-- Right Page Inner Luminous 3D Highlight Layer -->
    <path d="M374 200 
             L374 298 
             C374 332 340 368 262 398 
             L262 274 
             C298 252 336 226 374 200 Z" 
          fill="url(#rightSheen)" />

    <!-- Right Page Top Rim Highlight -->
    <path d="M388 192 L260 268" 
          fill="none"
          stroke="#FFFFFF" 
          stroke-width="2.5" 
          stroke-linecap="round" 
          opacity="0.6" />

    <!-- Right Page Outer Edge Highlight -->
    <path d="M388 192 L388 306 C388 346 348 384 262 408" 
          fill="none" 
          stroke="rgba(255, 255, 255, 0.25)" 
          stroke-width="2" />

    <!-- Center Book Spine Groove -->
    <path d="M254 268 L258 268 L258 404 L254 404 Z" fill="#031F15" />

    <!-- Bottom Center Organic Leaf Notch -->
    <path d="M248 408 Q256 394 264 408 Z" fill="#083827" />

    <!-- ========================================== -->
    <!-- GRADUATION CAP (MORTARBOARD)               -->
    <!-- ========================================== -->

    <!-- Skull Cap Base Underneath -->
    <path d="M210 178 
             C210 178 224 222 256 222 
             C288 222 302 178 302 178
             C302 178 286 206 256 206
             C226 206 210 178 210 178 Z" 
          fill="#FFFFFF" />

    <!-- Mortarboard Lower Edge Thickness -->
    <polygon points="158,162 158,167 256,206 354,167 354,162 256,201" 
             fill="#CBD5E1" />

    <!-- Mortarboard Diamond Top Board -->
    <polygon points="256,122 354,162 256,201 158,162" 
             fill="#FFFFFF" />

    <!-- Highlight Edge on Top Diamond (fill="none" ensures no solid overlay) -->
    <path d="M158 162 L256 122 L354 162" 
          fill="none"
          stroke="#FFFFFF" 
          stroke-width="2" 
          stroke-linecap="round" />

    <!-- Center Button on Mortarboard Top -->
    <ellipse cx="256" cy="162" rx="4.5" ry="3.5" fill="#E2E8F0" />
    <ellipse cx="256" cy="161.5" rx="3.5" ry="2.5" fill="#FFFFFF" />

    <!-- Tassel Ribbon & Hanging Cord -->
    <path d="M256 162 
             C290 160 334 161 346 163 
             L346 208" 
          fill="none" 
          stroke="#FFFFFF" 
          stroke-width="3" 
          stroke-linecap="round" 
          stroke-linejoin="round" />

    <!-- Tassel Bead & Tip Drop -->
    <circle cx="346" cy="212" r="5" fill="#FFFFFF" />
    <ellipse cx="346" cy="218" rx="2.5" ry="4" fill="#FFFFFF" />

  </g>
</svg>`;
}

// Full Learnora Brand Presentation Vector (Logo + Typography + Tagline)
function getFullBrandPresentationSvg() {
  const iconPart = getAppIconSvg(false);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&amp;family=Outfit:wght@500;600;700&amp;display=swap');
      .brand-title {
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        font-weight: 800;
        font-size: 118px;
        fill: #063928;
        letter-spacing: -2px;
      }
      .brand-tagline {
        font-family: 'Outfit', system-ui, -apple-system, sans-serif;
        font-weight: 600;
        font-size: 34px;
        fill: #0E4833;
        letter-spacing: 12px;
        text-transform: uppercase;
      }
    </style>

    <filter id="presShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#021A11" flood-opacity="0.18" />
    </filter>
  </defs>

  <!-- Clean Canvas Background -->
  <rect width="1024" height="1024" fill="#FFFFFF" />

  <!-- App Icon Squircle at Top (Scale 440x440, centered horizontally) -->
  <g transform="translate(292, 90) scale(0.86)" filter="url(#presShadow)">
    ${iconPart.replace(/<\?xml.*?\?>/, '').replace(/<svg.*?>/, '').replace(/<\/svg>/, '')}
  </g>

  <!-- Wordmark: Learnora with custom leaf in 'o' -->
  <g transform="translate(512, 630)" text-anchor="middle">
    <text class="brand-title" x="0" y="0">Learn<tspan dx="1">o</tspan><tspan dx="2">ra</tspan></text>
    
    <!-- Stylized leaf accent overlaying the 'o' (centered around x = 100, y = -36) -->
    <path d="M 98 -46 
             C 114 -60 134 -58 138 -36 
             C 138 -20 120 -12 98 -46 Z" 
          fill="#10B981" />
    <path d="M 98 -46 C 114 -40 126 -34 136 -36" 
          fill="none"
          stroke="#FFFFFF" 
          stroke-width="2.5" 
          stroke-linecap="round" />
  </g>

  <!-- Tagline: Learn • Grow • Achieve -->
  <g transform="translate(512, 705)" text-anchor="middle">
    <text class="brand-tagline" x="0" y="0">Learn &#160;•&#160; Grow &#160;•&#160; Achieve</text>
  </g>
</svg>`;
}

// Multi-Resolution ICO file generator from 32x32 PNG buffer
function createIcoFromPng(png32Buffer) {
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // Type 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // 1 Image

  const icoDirEntry = Buffer.alloc(16);
  icoDirEntry.writeUInt8(32, 0); // Width 32
  icoDirEntry.writeUInt8(32, 1); // Height 32
  icoDirEntry.writeUInt8(0, 2);  // Palette colors (0 = no palette)
  icoDirEntry.writeUInt8(0, 3);  // Reserved
  icoDirEntry.writeUInt16LE(1, 4); // Color planes
  icoDirEntry.writeUInt16LE(32, 6); // Bits per pixel
  icoDirEntry.writeUInt32LE(png32Buffer.length, 8); // Image size in bytes
  icoDirEntry.writeUInt32LE(6 + 16, 12); // Offset to image data

  return Buffer.concat([icoHeader, icoDirEntry, png32Buffer]);
}

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');

  console.log('Generating high-resolution Brand Asset SVGs...');
  const iconSvg = getAppIconSvg(false);
  const maskableSvg = getAppIconSvg(true);
  const fullPresentationSvg = getFullBrandPresentationSvg();

  fs.writeFileSync(path.join(publicDir, 'icon.svg'), iconSvg, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'icon-maskable.svg'), maskableSvg, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'logo-presentation.svg'), fullPresentationSvg, 'utf8');

  const svgBuffer = Buffer.from(iconSvg);
  const maskableSvgBuffer = Buffer.from(maskableSvg);

  console.log('Rendering rasterized PNG assets with sharp...');

  // 1. PWA 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✓ Created public/pwa-512x512.png');

  // 2. PWA 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✓ Created public/pwa-192x192.png');

  // 3. PWA Maskable 512x512 (Strict PWA safe zone compliant)
  await sharp(maskableSvgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✓ Created public/pwa-maskable-512x512.png');

  // 4. Apple Touch Icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created public/apple-touch-icon.png');

  // 5. Favicon 32x32
  const png32 = await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), png32);
  console.log('✓ Created public/favicon-32x32.png');

  // 6. Favicon 16x16
  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('✓ Created public/favicon-16x16.png');

  // 7. Favicon.ico
  const icoBuffer = createIcoFromPng(png32);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('✓ Created public/favicon.ico');

  // 8. Full Brand Presentation PNG (1024x1024)
  await sharp(Buffer.from(fullPresentationSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(publicDir, 'learnora-brand-asset.png'));
  console.log('✓ Created public/learnora-brand-asset.png');

  console.log('All PWA app logos and favicons successfully updated!');
}

main().catch(err => {
  console.error('Error generating brand icons:', err);
  process.exit(1);
});
