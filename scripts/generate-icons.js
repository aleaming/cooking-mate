/**
 * Icon Generation Script for Cooking Mate
 *
 * Generates all required favicon and app icons from the source SVG logo.
 *
 * Usage: node scripts/generate-icons.js
 *
 * Prerequisites: npm install --save-dev sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_SVG = path.join(__dirname, '../src/app/cooking-mate-logo.svg');
const APP_DIR = path.join(__dirname, '../src/app');
const PUBLIC_DIR = path.join(__dirname, '../public');

// Icon configurations
const ICONS = [
  // Favicon - 32x32 PNG (will be converted to ICO format)
  { output: path.join(APP_DIR, 'favicon-32.png'), size: 32 },
  { output: path.join(APP_DIR, 'favicon-16.png'), size: 16 },

  // Apple Touch Icon - 180x180
  { output: path.join(APP_DIR, 'apple-icon.png'), size: 180 },

  // PWA Icons
  { output: path.join(PUBLIC_DIR, 'icon-192.png'), size: 192 },
  { output: path.join(PUBLIC_DIR, 'icon-512.png'), size: 512 },

  // Maskable icons (with 10% padding for safe zone)
  { output: path.join(PUBLIC_DIR, 'icon-maskable-192.png'), size: 192, maskable: true },
  { output: path.join(PUBLIC_DIR, 'icon-maskable-512.png'), size: 512, maskable: true },
];

async function generateIcon({ output, size, maskable = false }) {
  console.log(`Generating ${path.basename(output)} (${size}x${size})${maskable ? ' [maskable]' : ''}...`);

  try {
    if (maskable) {
      // For maskable icons, add padding (safe zone is inner 80%)
      const padding = Math.round(size * 0.1);
      const innerSize = size - (padding * 2);

      // Create a background and composite the logo with padding
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 248, g: 245, b: 240, alpha: 1 } // #f8f5f0 cream background
        }
      })
        .composite([{
          input: await sharp(SOURCE_SVG)
            .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toBuffer(),
          gravity: 'center'
        }])
        .png()
        .toFile(output);
    } else {
      // Standard icon - transparent background
      await sharp(SOURCE_SVG)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(output);
    }

    console.log(`  ✓ Created ${path.basename(output)}`);
  } catch (error) {
    console.error(`  ✗ Failed to create ${path.basename(output)}:`, error.message);
  }
}

async function copyLogoToPublic() {
  console.log('Copying logo SVG to public directory...');
  const dest = path.join(PUBLIC_DIR, 'cooking-mate-logo.svg');
  fs.copyFileSync(SOURCE_SVG, dest);
  console.log('  ✓ Copied cooking-mate-logo.svg');
}

async function copyIconSvg() {
  console.log('Copying icon SVG to app directory...');
  const dest = path.join(APP_DIR, 'icon.svg');
  fs.copyFileSync(SOURCE_SVG, dest);
  console.log('  ✓ Copied icon.svg');
}

async function createFaviconIco() {
  console.log('Creating favicon.ico...');
  // For simplicity, we'll use the 32x32 PNG as favicon
  // In production, you might want to use a proper ICO generator
  const favicon32 = path.join(APP_DIR, 'favicon-32.png');
  const faviconIco = path.join(APP_DIR, 'favicon.ico');

  // Sharp can't create .ico files, so we'll create a multi-size PNG
  // Next.js App Router accepts PNG favicons, so we'll use that
  await sharp(SOURCE_SVG)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(faviconIco.replace('.ico', '.png'));

  console.log('  ✓ Created favicon.png (rename to favicon.ico or use as-is)');

  // Clean up intermediate files
  if (fs.existsSync(favicon32)) {
    fs.unlinkSync(favicon32);
  }
  const favicon16 = path.join(APP_DIR, 'favicon-16.png');
  if (fs.existsSync(favicon16)) {
    fs.unlinkSync(favicon16);
  }
}

async function main() {
  console.log('\n🎨 Generating Cooking Mate Icons\n');
  console.log(`Source: ${SOURCE_SVG}\n`);

  // Check if source exists
  if (!fs.existsSync(SOURCE_SVG)) {
    console.error('❌ Source SVG not found:', SOURCE_SVG);
    process.exit(1);
  }

  // Ensure directories exist
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  // Generate all icons
  for (const icon of ICONS) {
    await generateIcon(icon);
  }

  // Copy SVG files
  await copyLogoToPublic();
  await copyIconSvg();

  // Create favicon
  await createFaviconIco();

  console.log('\n✅ Icon generation complete!\n');
  console.log('Generated files:');
  console.log('  - src/app/icon.svg');
  console.log('  - src/app/apple-icon.png');
  console.log('  - src/app/favicon.png');
  console.log('  - public/cooking-mate-logo.svg');
  console.log('  - public/icon-192.png');
  console.log('  - public/icon-512.png');
  console.log('  - public/icon-maskable-192.png');
  console.log('  - public/icon-maskable-512.png');
}

main().catch(console.error);
