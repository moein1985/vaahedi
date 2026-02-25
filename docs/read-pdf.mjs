import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const buf = readFileSync('سایت جدید.pdf');
const data = await pdfParse(buf);
console.log(data.text);
