const fs = require('fs');
const pdfParse = require('pdf-parse');
const buf = fs.readFileSync('سایت جدید.pdf');
pdfParse(buf).then(d => {
  console.log(d.text);
}).catch(e => console.error('ERROR:', e.message));
