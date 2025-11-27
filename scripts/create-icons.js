// Simple icon creation using data URLs
const fs = require('fs');
const path = require('path');

// Create icons directory
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple SVG for each icon size
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const createSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff00ff"/>
      <stop offset="33%" style="stop-color:#00ffff"/>
      <stop offset="66%" style="stop-color:#ffff00"/>
      <stop offset="100%" style="stop-color:#ff00ff"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="100" height="100" fill="#000000" rx="15"/>
  <text x="50" y="75" font-size="80" font-weight="900" font-family="Impact, Arial Black, sans-serif" text-anchor="middle" fill="url(#g1)" filter="url(#glow)" style="paint-order:stroke;stroke:#000;stroke-width:3px">G</text>
</svg>`;

sizes.forEach(size => {
  const svg = createSVG(size);
  const filename = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Created: icon-${size}x${size}.svg`);
});

console.log('\nAll icon files created successfully!');
console.log('Note: SVG files created. For PNG files, you can convert these using an online converter or image tool.');
