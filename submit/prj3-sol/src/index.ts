#!/usr/bin/env node

import { main } from './lib/main.js';

main(process.argv.slice(2)).catch((err: any) => console.error(err));
