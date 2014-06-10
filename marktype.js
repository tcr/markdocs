#!/usr/bin/env node

var marktype = require('./index.js');

if (process.argv.length < 4) {
  console.error('Usage: marktype (convert|restore) file.md');
  process.exit(1);
}


var lines = [];

var fs = require('fs');
var filename = process.argv[3];

var input = fs.readFileSync(filename, 'utf-8');

fs.writeFileSync(filename, input.split(/\r?\n/).map(function (line) {
  if (process.argv[2] == 'restore' && line.match(/^&#x20;/)) {
    return marktype.restore(line);
  } else if (line.match(/^\[#\]/)) {
    return marktype.convert(line.replace(/^\[#\]\s*/, ''));
  }
  return line;
}).join('\n'), 'utf-8');
console.error('wrote to', filename);
