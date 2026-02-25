const { PdfReader } = require('pdfreader');
const fs = require('fs');
const path = require('path');

const items = [];
new PdfReader().parseBuffer(
  fs.readFileSync(path.join(__dirname, 'docs', 'سایت جدید.pdf')),
  (err, item) => {
    if (err) { console.error('ERR', err); return; }
    if (!item) { console.log(items.join('\n')); return; }
    if (item.text) items.push(item.text);
  }
);
