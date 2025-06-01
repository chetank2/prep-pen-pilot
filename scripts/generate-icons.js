import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes needed according to manifest.json
const iconSizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

// Additional icons for shortcuts
const shortcutIcons = [
  { size: 96, name: 'upload-96x96.png' },
  { size: 96, name: 'note-96x96.png' },
  { size: 96, name: 'mindmap-96x96.png' }
];

async function generateIcons() {
  try {
    // Try to use sharp if available
    let sharp;
    try {
      const sharpModule = await import('sharp');
      sharp = sharpModule.default;
      console.log('Using Sharp for icon generation...');
      await generateWithSharp(sharp);
    } catch (err) {
      console.log('Sharp not available, using canvas fallback...');
      await generateWithCanvas();
    }
  } catch (error) {
    console.error('Failed to generate icons:', error);
    // Create placeholder files as fallback
    await createPlaceholders();
  }
}

async function generateWithSharp(sharp) {
  const svgPath = path.join(__dirname, '../public/icons/icon-base.svg');
  const svgBuffer = fs.readFileSync(svgPath);
  
  for (const icon of iconSizes) {
    const outputPath = path.join(__dirname, '../public/icons', icon.name);
    await sharp(svgBuffer)
      .resize(icon.size, icon.size)
      .png()
      .toFile(outputPath);
    console.log(`Generated ${icon.name}`);
  }

  // Generate shortcut icons (simplified versions)
  for (const icon of shortcutIcons) {
    const outputPath = path.join(__dirname, '../public/icons', icon.name);
    await sharp(svgBuffer)
      .resize(icon.size, icon.size)
      .png()
      .toFile(outputPath);
    console.log(`Generated ${icon.name}`);
  }
}

async function generateWithCanvas() {
  // Try to use canvas if available
  try {
    const canvasModule = await import('canvas');
    const { createCanvas } = canvasModule;
    
    for (const icon of [...iconSizes, ...shortcutIcons]) {
      const canvas = createCanvas(icon.size, icon.size);
      const ctx = canvas.getContext('2d');
      
      // Simple colored square as fallback
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, 0, icon.size, icon.size);
      
      // Add text
      ctx.fillStyle = 'white';
      ctx.font = `bold ${icon.size / 8}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('PREP', icon.size / 2, icon.size / 2 + icon.size / 16);
      
      const outputPath = path.join(__dirname, '../public/icons', icon.name);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);
      console.log(`Generated ${icon.name} with canvas`);
    }
  } catch (err) {
    console.log('Canvas not available, creating simple placeholders...');
    await createPlaceholders();
  }
}

async function createPlaceholders() {
  // Create simple SVG placeholders that browsers can use
  for (const icon of [...iconSizes, ...shortcutIcons]) {
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${icon.size}" height="${icon.size}" viewBox="0 0 ${icon.size} ${icon.size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${icon.size}" height="${icon.size}" fill="#3b82f6"/>
  <text x="${icon.size/2}" y="${icon.size/2 + icon.size/16}" font-family="Arial, sans-serif" font-size="${icon.size/8}" font-weight="bold" text-anchor="middle" fill="white">PREP</text>
</svg>`;
    
    // Save as SVG (browsers can handle SVG icons)
    const outputPath = path.join(__dirname, '../public/icons', icon.name.replace('.png', '.svg'));
    fs.writeFileSync(outputPath, svgContent);
    console.log(`Generated placeholder ${icon.name.replace('.png', '.svg')}`);
  }
  
  console.log('Note: Generated SVG placeholders. For PNG icons, install sharp: npm install sharp');
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

generateIcons().then(() => {
  console.log('Icon generation complete!');
}).catch(console.error); 