#!/usr/bin/env node
/* eslint-disable no-undef -- Allow process and console in ignored file */

import { existsSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const envExamplePath = resolve(__dirname, '../.env.example');
const envPath = resolve(__dirname, '../.env');

try {
  if (existsSync(envPath)) {
    console.log(`⚠️  .env file already exists. Skipping creation.`);
  } else {
    copyFileSync(envExamplePath, envPath);
    console.log(`✅  .env file created successfully from .env.example.`);
  }
} catch (error) {
  console.error(`❌  Error during post-install script: ${error.message}`);
}
