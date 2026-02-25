process.env.NODE_PATH = __dirname + '/node_modules';
require('module').Module._initPaths();

const { PdfReader } = require('pdfreader');
const fs = require('fs');
const path = require('path');

const items = [];
new PdfReader().parseBuffer(
  fs.readFileSync(path.join(__dirname, 'docs', 'سایت جدید.pdf')),
  (err, item) => {
    if (err) { process.stderr.write('ERR: ' + JSON.stringify(err) + '\n'); return; }
    if (!item) { process.stdout.write(items.join('\n') + '\n'); return; }
    if (item.text) items.push(item.text);
  }
);
