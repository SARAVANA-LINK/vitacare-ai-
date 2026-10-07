/**
 * VitaCare AI - Codebase Consolidator & Single-File Exporter
 * 
 * Usage:
 *   node export_codebase_bundle.js
 * 
 * This generates "VITA_CARE_ALL_CODE.md", concatenating all backend and frontend
 * source files into a single, clean markdown document with file paths and syntax highlighting.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const OUTPUT_FILE = path.join(ROOT_DIR, 'VITA_CARE_ALL_CODE.md');

const INCLUDE_EXTENSIONS = ['.js', '.jsx', '.json', '.html', '.css'];
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'uploads', 'brain'];
const EXCLUDE_FILES = ['package-lock.json', 'eng.traineddata', 'VITA_CARE_ALL_CODE.md', '.env', '.env.local'];

let consolidatedContent = `# VitaCare AI – Consolidated Codebase Bundle
Generated: ${new Date().toISOString()}

This file contains the complete source code of the VitaCare AI platform consolidated into a single document.

---

`;

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(ROOT_DIR, fullPath);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(file)) {
        walkDir(fullPath);
      }
    } else {
      const ext = path.extname(file);
      if (INCLUDE_EXTENSIONS.includes(ext) && !EXCLUDE_FILES.includes(file)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lang = ext === '.jsx' ? 'jsx' : ext === '.js' ? 'javascript' : ext === '.json' ? 'json' : ext === '.css' ? 'css' : ext === '.html' ? 'html' : 'text';
          consolidatedContent += `\n## File: ${relPath.replace(/\\/g, '/')}\n\n\`\`\`${lang}\n${content}\n\`\`\`\n\n---\n`;
        } catch (e) {
          console.warn(`Could not read file: ${relPath}`, e.message);
        }
      }
    }
  }
}

console.log('Collecting source files across VitaCare AI...');
walkDir(ROOT_DIR);

fs.writeFileSync(OUTPUT_FILE, consolidatedContent, 'utf8');
console.log(`Successfully generated consolidated code file at: ${OUTPUT_FILE}`);
console.log(`Total bundle size: ${(fs.statSync(OUTPUT_FILE).size / (1024 * 1024)).toFixed(2)} MB`);
