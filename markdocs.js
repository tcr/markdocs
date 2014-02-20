#!/usr/bin/env node

var fs = require('fs');
var marked = require('marked');

// markdocs convert file.txt [-o file.md]
// markdocs insert file.txt [-t README.md]
// markdocs clear [-t README.md]

var parser = require('nomnom')

parser
  .script('markdocs')
  .command('convert')
  .option('input', {
    position: 1,
    full: 'file.txt',
    required: true,
  })
  .option('output', {
    abbr: 'o',
    full: 'file.md',
    help: 'markdown file to output. defaults to renaming input.txt to input.md'
  })
  .callback(convert)
  .help('convert api docs into a markdown file.')

parser
  .script('markdocs')
  .command('insert')
  .option('input', {
    position: 1,
    full: 'file.txt',
    required: true,
  })
  .option('target', {
    abbr: 'o',
    full: 'target.md',
    default: 'README.md',
    help: 'markdown file to insert into'
  })
  .callback(insert)
  .help('insert api docs into an existing markdown file. inbetween <!--markdocs-->...<!--/markdocs--> comments')

parser
  .script('markdocs')
  .command('clear')
  .option('target', {
    abbr: 'o',
    full: 'target.md',
    default: 'README.md',
    help: 'clears api docs.'
  })
  .callback(clear)
  .help('clear api docs from an existing markdown file. inbetween <!--markdocs-->...<!--/markdocs--> comments')

parser
  .script('markdocs')
  .command('preview')
  .option('input', {
    position: 1,
    full: 'file.txt',
    required: true,
  })
  .option('browser', {
    abbr: 'b',
    flag: true,
    help: 'launch immediately in browser.'
  })
  .callback(preview)
  .help('preview compiled api markdown')

parser.parse()


/**
 * api
 */

function safeify (str) {
  return str.replace(/[^\w]+/g, '-');
}

function markdownify (data)
{
  var lines = data.split(/\n/);
  var out = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    // Skip empty lines
    if (line.match(/^\s*$/)) {
      continue;
    }

    // Headers
    if (line.match(/^#/)) {
      out.push('##' + line);

      // Immediately subsequent para
      while (lines[++i].match(/^\s*$/)) {
        continue;
      }
      out.push(lines[i]);
      out.push('');
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
        // replace `
        .replace(/`/g, '')
        // type / return type (ie: [string] process.platform)
        .replace(/^([\w<>]+)(?=\s+\w)/i, function (str) {
          return '<i>' + str.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</i>&nbsp;'
        })
        // object property (ie: string process.[platform])
        .replace(/(\.\w+|\w+\b(?!\s*\.))(?=\s*[\(\[\{=]|\s*$)/i, '<b>$1</b>')
        // function arguments
        .replace(/\(.*\)/g, function (str) {
          return str
            // paren spacing
            .replace(/\(\s*/, '( ').replace(/\s*\)$/, ' )')
            .replace(/\(\s+\)/, '()')
            // codify arguments
            .replace(/\b(([^,\(\)\[\]\{\}\|]+)\s*(\([^\(\)\[\]\{\}\|\s]*\))?\b)/g, function (_, arg) {
              var split = arg.split(/\s+/);
              if (split.length > 1) {
                return '<i>' + split[0] + '</i>&nbsp; ' + split.slice(1).join(' ');
              } else {
                return arg;
              }
            })
            // italicize "or"
            .replace(/\b\s+or\s+\b/g, ' *or* ')
        })
        // HTTP methods (ie: [POST] /:username/tweets)
        .replace(/^([A-Z]+)\b/, '<b>$1</b>')
        // HTTP path segments (ie: POST /[:username]/tweets)
        .replace(/:(\w+)/, '`:$1`')
        // func -> return
        .replace(/->\s+([^>]+)$/, '&rarr; <i>$1</i>')

      out.push('&#x20;<a href="#api-' + safeify(line) + '" name="api-' + safeify(line) + '">#</a> ' + sig + '  ');
      out.push(lines[++i] + '\n');
    }
  }

  return out.join('\n');
}

function mungefile (file, callback)
{
  fs.readFile(file, 'utf-8', function (err, data) {
    callback(err, data, function (outfile, data, next) {
      fs.writeFile(outfile || file, data, next);
    })
  })
}

function exit (err) {
  throw err
}

function populatetags (data, content) {
  return data.replace(/<!--markdocs-->[\S\s]*<!--\/markdocs-->/, '<!--markdocs-->' + content + '<!--/markdocs-->')
}


/**
 * entry
 */

function convert (opts) {
  console.log('converting:', opts.input)
  mungefile(opts.input, function (err, api, write) {
    err && exit(err)
    var out = opts.output || opts.input.replace(/\.txt$/, '.md');
    write(out, markdownify(api), function (err) {
      err && exit(err)
      console.error('conversion done:', out);
    });
  })
}

function insert (opts) {
  console.log('insert:', opts.input);
  console.log('into:', opts.target)
  mungefile(opts.input, function (err, api, write) {
    err && exit(err)

    mungefile(opts.target, function (err, data, write) {
      write(null, populatetags(data, '\n<!--generated by https://github.com/tcr/markdocs-->\n\n' + markdownify(api) + '\n'), function (err) {
        err && exit(err)
        console.error('insertion done:', opts.target);
      });
    });
  })
}

function clear (opts) {
  console.log('clearing:', opts.target)
  mungefile(opts.target, function (err, data, write) {
    write(null, populatetags(data, ''), function (err) {
      err && exit(err)
      console.error('clearing done:', opts.target);
    });
  });
}

function preview (opts) {
  console.log('previewing:', opts.input);
  mungefile(opts.input, function (err, data, write) {

    fs.writeFileSync('/tmp/markdocs.html', '<style>body { font: 14px Helvetica, arial, freesans, clean, sans-serif; width: 750px; padding: 20px 30px; line-height: 1.5; }</style>' + marked(markdownify(data)));
    console.log('open: file:///tmp/markdocs.html')
    if (opts.browser) {
      require('open')('file:///tmp/markdocs.html')
    }
  })
}