#!/usr/bin/env node
// Simple wrapper that imports the main CLI
// Using dynamic import with relative path (works in all cases)
import('../dist/cli.js').catch(error => {
  console.error(error);
  process.exit(1);
});
