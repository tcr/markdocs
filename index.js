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

function generate (line)
{
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
        + '\n'
    })
    // HTTP methods (ie: [POST] /:username/tweets)
    .replace(/^([A-Z]+)\b/, '<b>$1</b>')
    // HTTP path segments (ie: POST /[:username]/tweets)
    .replace(/:(\w+)/, '`:$1`')
    // func -> return
    .replace(/(\n\s*)?->\s+([^>]+)$/, '&rarr; <i>$2</i>\n')

  if (sig.match(/\{\s*$/)) {
    while (lines[i + 1] != null && !lines[i + 1].match(/^\s*\}/)) {
      sig += '  \n&nbsp; ' + lines[++i].replace(/(\S.*\S)/, '`$1`').replace(/^\s+/g, '&nbsp;&nbsp;');
    }
    sig += '  \n&nbsp; ' + lines[++i];
  }

  sig = sig.replace(/\n$/, '').replace(/\n/, '  \n') + '  ';

  return ('&#x20;<a href="#api-' + safeify(line) + '" name="api-' + safeify(line) + '">#</a> ' + sig);
}

function restore (data)
{
  return data
    .replace(/^&#x20;.*/mg, function (line) {
      return line
        .replace(/&#x20;/g, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/^ # /g, '[#] ')
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


exports.convert = generate;
exports.restore = restore;