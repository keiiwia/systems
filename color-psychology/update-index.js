// Script to update root index.html with built file paths after Vite build
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the built index.html from dist
const distHtml = readFileSync(join(__dirname, 'dist', 'index.html'), 'utf-8');

// Extract the script and link tags
const scriptMatch = distHtml.match(/<script[^>]*src="([^"]+)"[^>]*>/);
const linkMatch = distHtml.match(/<link[^>]*href="([^"]+)"[^>]*>/);

if (scriptMatch && linkMatch) {
  const scriptPath = scriptMatch[1];
  const linkPath = linkMatch[1];
  
  // Remove leading ./ if present, then add dist/ prefix
  const cleanScriptPath = scriptPath.startsWith('./') ? scriptPath.slice(2) : scriptPath;
  const cleanLinkPath = linkPath.startsWith('./') ? linkPath.slice(2) : linkPath;
  
  const rootScriptPath = `./dist/${cleanScriptPath}`;
  const rootLinkPath = `./dist/${cleanLinkPath}`;
  
  // Read the root index.html template
  let rootHtml = readFileSync(join(__dirname, 'index.html'), 'utf-8');
  
  // Find and replace the script tag (match the entire tag including closing)
  rootHtml = rootHtml.replace(
    /<script[^>]*src="[^"]*"[^>]*><\/script>/,
    `<script type="module" crossorigin src="${rootScriptPath}"></script>`
  );
  
  // Check if link tag exists, if not add it after the script tag
  if (!rootHtml.includes('<link rel="stylesheet"')) {
    rootHtml = rootHtml.replace(
      /(<script[^>]*><\/script>)/,
      `$1\n    <link rel="stylesheet" crossorigin href="${rootLinkPath}">`
    );
  } else {
    // Replace existing link tag
    rootHtml = rootHtml.replace(
      /<link[^>]*href="[^"]*"[^>]*>/,
      `<link rel="stylesheet" crossorigin href="${rootLinkPath}">`
    );
  }
  
  // Write back to root index.html
  writeFileSync(join(__dirname, 'index.html'), rootHtml);
  console.log('Updated root index.html with built file paths');
} else {
  console.error('Could not find script or link tags in dist/index.html');
  console.error('Script match:', scriptMatch);
  console.error('Link match:', linkMatch);
  process.exit(1);
}
