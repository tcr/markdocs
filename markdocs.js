#!/usr/bin/env node

var marktype = require('./index.js');

if (process.argv.length < 4) {
  console.error('Usage: marktype (convert|restore) file.md');
  process.exit(1);
}


var lines = [];

var fs = require('fs');
var filename = process.argv[3];
require('readline').createInterface({
  input: fs.createReadStream(filename),
  terminal: false
}).on('line', function(line){
  if (process.argv[2] == 'restore') {
    if (line.match(/^&#x20;/)) {
      lines.push(marktype.restore(line));
    } else {
      lines.push(line);
    }
  } else {
    if (line.match(/^\[#\]/)) {
      lines.push(marktype.convert(line.replace(/^\[#\]\s*/, '')));
    } else {
      lines.push(line);
    }
  }
}).on('close', function () {
  fs.writeFileSync(filename, lines.join('\n'), 'utf-8');
  console.error('wrote to', filename);
});