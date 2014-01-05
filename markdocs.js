#!/usr/bin/env node

var fs = require('fs');

var opts = require('optimist')
  .usage('Generate Markdown API documentation.\nUsage: $0')
  .string('i').alias('i', 'input').describe('i', 'File for API input.')
  .string('o').alias('o', 'output').describe('o', 'File to output markdown to.')
  .boolean('r').alias('r', 'readme').describe('r', 'Generate directly into "## API" section in your README.md file.')
  .boolean('h').alias('h', 'help').describe('h', 'Show usage.')

if (opts.argv.h || !opts.argv.i || !(opts.argv.r || opts.argv.o)) {
  opts.showHelp();
  process.exit(1);
}

console.error('Loading ' + String(opts.argv.i) + '...');
var data = fs.readFileSync(opts.argv.i, 'utf-8');

function safeify (str) {
  return str.replace(/[^\w]+/g, '-');
}

var lines = data.split(/\n+/).filter(function (n) { return !n.match(/^\s*$/); });
var out = [];

for (var i = 0; i < lines.length; i++) {
  var line = lines[i];

  // Headers
  if (line.match(/^#/)) {
    out.push('##' + line + '\n' + lines[++i] + '\n');
  }

  // Code sections (following signatures).
  else if (line.match(/^```/)) {
    out.push(line);
    while (!(line = lines[++i]).match(/^```/)) {
      out.push(line);
    }
    out.push(line + '\n');
  }

  // Signatures.
  else {
    var sig = line
      // type / return type (ie: [string] process.platform)
      .replace(/^(array([<>\w]*)|number|str(ing)?)/i, function (str) {
        return '<i>' + str.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</i>&nbsp;'
      })
      // object property (ie: string process.[platform])
      .replace(/\.(\w+)/, '.<b>$1</b>')
      // function arguments
      .replace(/\([^)]*\)/g, function (str) {
        return str
          // paren spacing
          .replace(/\(\s*/, '( ').replace(/\s*\)/, ' )')
          // codify arguments
          .replace(/([^\s,\(\)\[\]\{\}\|]+)/g, '`$1`')
          // allow "or" unmodified
          .replace(/`\s*`or`/g, '` or')
      })
      // HTTP methods (ie: [POST] /:username/tweets)
      .replace(/^([A-Z]+)\b/, '<b>$1</b>')
      // HTTP path segments (ie: POST /[:username]/tweets)
      .replace(/:(\w+)/, '`:$1`');

    out.push('&#x20;<a href="#api-' + safeify(line) + '" name="api-' + safeify(line) + '">#</a> ' + sig + '  ');
    out.push(lines[++i] + '\n');
  }
}

var apimd = out.join('\n');

if (opts.argv.r) {
  console.error('Generating README.md "API" section from API.txt...');
  var readme = fs.readFileSync('./README.md', 'utf-8');

  var readme = readme.replace(/## API(.|[\r\n])+?\n## /, '## API\n\n' + apimd + '\n\n## ');
  fs.writeFileSync('./README.md', readme);
} else {
  console.log('Writing into ' + String(opts.argv.o) + '...');
  fs.writeFileSync(opts.argv.o, apimd);
}

console.error('Done.');