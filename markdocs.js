#!/usr/bin/env node

var fs = require('fs');
var marked = require('marked');
var markdocs = require('./index');

// markdocs preview file.txt [-b]
// markdocs generate file.txt
// markdocs clear [README.md]

var parser = require('nomnom')

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
    help: 'preview immediately in browser.'
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
  .help('insert api docs into an existing markdown file. inbetween <!--markdocs-->...<!--/markdocs--> comments')

parser
  .script('markdocs')
  .command('restore')
  .option('target', {
    position: 1,
    full: 'target.md',
    default: 'README.md',
    help: 'restores text representation.'
  })
  .callback(restore)
  .help('restores text version of markdown file. inbetween <!--markdocs-->...<!--/markdocs--> comments')

parser.parse()


/**
 * api
 */

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

function restoretags (data, cb) {
  return data.replace(/<!--markdocs:generated-->\s*([\S\s]*?)<!--\/markdocs:generated-->/g, function (str, source) {
    return '<!--markdocs-->\n\n'
      + markdocs.restore(source) + '\n\n'
      + '<!--/markdocs-->';
  });
}

function generatetags (data, cb) {
  return data.replace(/<!--markdocs-->\s*([\S\s]*?)<!--\/markdocs-->/g, function cb (str, source) {
    return '<!--markdocs:generated-->\n\n'
      + markdocs.generate(source) + '\n'
      + '<!--/markdocs:generated-->';
  });
}


/**
 * entry
 */

function preview (opts)
{
  console.log('previewing:', opts.input);
  mungefile(opts.input, function (err, data, write) {

    fs.writeFileSync('/tmp/markdocs.html', '<style>body { font: 14px Helvetica, arial, freesans, clean, sans-serif; width: 750px; padding: 20px 30px; line-height: 1.5; }</style>' + marked(markdocs.generate(data)));
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
    var transformed = generatetags(data);
    if (transformed == data) {
      console.error('ERROR: No <!--markdocs--> tags found. Aborting.');
      process.exit(1);
    }
    write(null, transformed, function (err) {
      err && exit(err)
      console.error('done.');
    });
  });
}

function restore (opts)
{
  console.log('restoring:', opts.target)
  mungefile(opts.target, function (err, data, write) {
    var transformed = restoretags(data);
    if (transformed == data) {
      console.error('ERROR: No <!--markdocs:generated--> tags found. Aborting.');
      process.exit(1);
    }
    write(null, transformed, function (err) {
      err && exit(err)
      console.error('done.');
    });
  });
}