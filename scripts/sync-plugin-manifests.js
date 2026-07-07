#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const packageJsonPath = path.join(rootDir, 'package.json');
const manifestPaths = [
  path.join(rootDir, '.codex-plugin', 'plugin.json'),
  path.join(rootDir, 'plugin', '.codex-plugin', 'plugin.json'),
  path.join(rootDir, '.claude-plugin', 'plugin.json'),
  path.join(rootDir, 'plugin', '.claude-plugin', 'plugin.json'),
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n');
}

function syncPlugin(plugin, pkg) {
  const author = typeof plugin.author === 'object' && plugin.author ? plugin.author : {};
  return {
    ...plugin,
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    homepage: pkg.homepage,
    repository: normalizeRepositoryUrl(pkg.repository),
    license: pkg.license,
    keywords: pkg.keywords,
    author: {
      ...author,
      name: normalizeAuthorName(pkg.author),
    },
    interface: plugin.interface ? {
      ...plugin.interface,
      developerName: normalizeAuthorName(pkg.author),
      websiteURL: normalizeRepositoryUrl(pkg.repository),
    } : undefined,
  };
}

function normalizeAuthorName(author) {
  if (typeof author === 'string') return author;
  if (author && typeof author === 'object' && typeof author.name === 'string') return author.name;
  return '';
}

function normalizeRepositoryUrl(repository) {
  if (typeof repository === 'string') return repository.replace(/\.git$/, '');
  if (repository && typeof repository === 'object' && typeof repository.url === 'string')
    return repository.url.replace(/\.git$/, '');
  return '';
}

function main() {
  if (!fs.existsSync(packageJsonPath)) {
    console.error(`Missing required file: ${packageJsonPath}`);
    process.exit(1);
  }

  const pkg = readJson(packageJsonPath);

  for (const manifestPath of manifestPaths) {
    if (fs.existsSync(manifestPath)) {
      const plugin = readJson(manifestPath);
      writeJson(manifestPath, syncPlugin(plugin, pkg));
    }
  }

  console.log('✓ Synced plugin manifests from package.json');
}

main();
