function safeify (str)
{
  return str.replace(/[^\w]+/g, '-').replace(/^\-+|\-+$/g, '');
}

function escapify (str)
{
  return str.replace(/[\`\*_\{\}\[\]\(\)#\+\-\.!]/g, function (a) {
    return '\\' + a;
  })
}

function generate (data)
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
      out.push('');

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

function restore (data)
{
  return data
    .replace(/^&#x20;.*/mg, function (line) {
      return line
        .replace(/&#x20;/g, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/^ # /g, '')
        .replace(/&nbsp;/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&rarr;/g, '->')
        .replace(/\s*$/, '')
    })
    .replace(/^\*/mg, ' *')
    .replace(/^\#\#\#/mg, '#')
    .replace(/ +$/mg, '')
    .replace(/^\s*|\s*$/g, '')
}


exports.generate = generate;
exports.restore = restore;