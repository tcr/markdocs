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

parser
  .script('markdocs')
  .command('generate')
  .option('target', {
    position: 1,
    full: 'target.md',
    default: 'README.md',
    help: 'markdown file to regenerate'
  })
  .callback(generate)
  .help('insert api docs into an existing markdown file. inbetween <!--markdocs path/to/api.txt-->...<!--/markdocs--> comments')

parser
  .script('markdocs')
  .command('clear')
  .option('target', {
    position: 1,
    full: 'target.md',
    default: 'README.md',
    help: 'clears api docs.'
  })
  .callback(clear)
  .help('clear api docs from an existing markdown file. inbetween <!--markdocs-->...<!--/markdocs--> comments')

parser.parse()


/**
 * api
 */

function safeify (str) {
  return str.replace(/[^\w]+/g, '-').replace(/^\-+|\-+$/g, '');
}

function escapify (str) {
  return str.replace(/[\`\*_\{\}\[\]\(\)#\+\-\.!]/g, function (a) {
    return '\\' + a;
  })
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

    // Eat multi-line comments
    if (line.match(/^\s*\/\*/)) {
      while (lines[i + 1] != null && !lines[i + 1].match(/^\s*\*\//)) {
        i++;
      }
      i++;
      continue;
    }

    // Headers
    if (line.match(/^#/)) {
      out.push('##' + line);

      // Immediately subsequent para
      while (lines[++i] != null && lines[i].match(/^\s*$/)) {
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
      out.push(line + '\n\n');
    }

    // List items or space-indented paras.
    else if (line.match(/^\*\s*(.*)|^\s+/)) {
      var str = line.replace(/^\s*|\s*$/g, '');
      if (lines[i + 1].match(/^\s*$/)) {
        str += '\n';
        ++i;
      }
      out.push(str);
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
                return '<i>' + escapify(split[0]) + '</i>&nbsp; ' + escapify(split.slice(1).join(' '));
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

      if (sig.match(/\{\s*$/)) {
        while (lines[i + 1] != null && !lines[i + 1].match(/^\s*\}/)) {
          sig += '  \n&nbsp; ' + lines[++i].replace(/(\S.*\S)/, '`$1`').replace(/^\s+/g, '&nbsp;&nbsp;');
        }
        sig += '  \n&nbsp; ' + lines[++i];
      }

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

function populatetags (data, cb) {
  return data.replace(/<!--markdocs\s+([^-]+)-->[\S\s]*?<!--\/markdocs-->/g, cb);
}


/**
 * entry
 */

function convert (opts)
{
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

function preview (opts)
{
  console.log('previewing:', opts.input);
  mungefile(opts.input, function (err, data, write) {

    fs.writeFileSync('/tmp/markdocs.html', '<style>body { font: 14px Helvetica, arial, freesans, clean, sans-serif; width: 750px; padding: 20px 30px; line-height: 1.5; }</style>' + marked(markdownify(data)));
    console.log('open: file:///tmp/markdocs.html')
    if (opts.browser) {
      require('open')('file:///tmp/markdocs.html')
    }
  })
}

function generate (opts)
{
  console.log('into:', opts.target)
  mungefile(opts.target, function (err, data, write) {
    write(null, populatetags(data, function cb (str, file, content) {
      console.log('inserting:', file);
      api = fs.readFileSync(file, 'utf-8');
      return '<!--markdocs ' + file + '-->\n'
        + '<!--generated by https://github.com/tcr/markdocs-->\n\n'
        + markdownify(api) + '\n'
        + '<!--/markdocs-->';
    }), function (err) {
      err && exit(err)
      console.error('done.');
    });
  });
}

function clear (opts)
{
  console.log('clearing:', opts.target)
  mungefile(opts.target, function (err, data, write) {
    write(null, populatetags(data, function (str, file) {
      return '<!--markdocs ' + file + '--><!--/markdocs-->';
    }), function (err) {
      err && exit(err)
      console.error('done.');
    });
  });
}