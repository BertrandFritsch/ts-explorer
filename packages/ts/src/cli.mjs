#!/usr/bin/env -S node --no-warnings

import './main.mjs'

process.on('uncaughtException', (error) => {
  console.error('Error:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Error:', reason);
  process.exit(1);
});
