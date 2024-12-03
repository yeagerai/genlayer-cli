#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envExamplePath = path.resolve(__dirname, '../.env.example');
const envPath = path.resolve(__dirname, '../.env');

try {
  if (fs.existsSync(envPath)) {
    console.log(`⚠️  .env file already exists. Skipping creation.`);
  } else {
    fs.copyFileSync(envExamplePath, envPath);
    console.log(`✅  .env file created successfully from .env.example.`);
  }
} catch (error) {
  console.error(`❌  Error during post-install script: ${error.message}`);
}
