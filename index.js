"use strict"

// ------------------------------------------------------------------------------------------------
// libs
// ------------------------------------------------------------------------------------------------

const stack = require('callsite'),
  livereload = require('livereload'),
  chokidar = require('chokidar'),
  colors = require('colors'),
  path = require('path'),
  fs = require('fs')

// ------------------------------------------------------------------------------------------------
// utils
// ------------------------------------------------------------------------------------------------

function timestamp () {
  const timestamp = (new Date()).toString().match(/\d{2}:\d{2}:\d{2}/)[0]
  return '[' + colors.gray(timestamp) + ']'
}

function log (value) {
  const values = Array.prototype.slice.call(arguments).join(' ')
  console.log(timestamp() + ' ' + values)
}

function makeGlob (path, ext) {
  return path.replace(/\/*$/, '/**/') + (ext || '*')
}

function pad (str, length) {
  str = String(str)
  while (str.length < length) str += ' '
  return str
}

// ------------------------------------------------------------------------------------------------
// watch
// ------------------------------------------------------------------------------------------------

function watch () {
  // properties
  const root = this.root
  const paths = [].concat(this.paths)
  const settings = this.settings.livereload
  const options = {
    usePolling: settings.usePolling,
    ignoreInitial: true
  }

  // callbacks
  const reload = (file, type) => {
    file = file.replace(root, '')
    log(pad('[' + type + ']', 8) + ' > ' + colors.cyan(file))
    server.refresh(type + ':' + file)
  }

  const restart = () => {
    this.load()
    if (JSON.stringify(settings) !== JSON.stringify(this.settings.livereload)) {
      wp.close()
      ws.close()
      server.close();
      setTimeout(this.watch.bind(this), 500)
    }
  }

  // restart when settings changes
  const ws = chokidar
    .watch(settingsPath, options)
    .on('change', restart)

  // watch
  const wp = chokidar
    .watch(paths, options)
    .on('add', file => reload(file, 'add'))
    .on('change', file => reload(file, 'change'))
    .on('unlink', file => reload(file, 'delete'))

  // debug
  const verb = settings.usePolling ? 'polling' : 'watching'
  log('Starting Sketchpad Reload, ' + verb + ' "' + settings.host + '":')
  console.log(paths.map(p => '  - ' + colors.cyan(p)).join('\n'))

  // start
  const server = livereload.createServer({start: true})
  server.watch('')
}

// ------------------------------------------------------------------------------------------------
// main
// ------------------------------------------------------------------------------------------------

function load () {
  const str = fs.readFileSync(settingsPath, 'utf8')
  if (str) {
    // settings
    this.settings = JSON.parse(str)

    // paths
    let paths = this.settings.paths.controllers
      .filter(obj => obj.enabled)
      .map(obj => obj.path)
      .concat(settings.paths.assets)
      .concat(settings.paths.views)
      .concat(settings.livereload.paths)

    // abs globs
    this.paths = paths
      .map(path => makeGlob(path))
      .map(p => path.normalize(this.root + '/' + p))
  }
}

function init (root, storage) {
  // root path
  const calling = path.dirname(stack()[1].getFileName()) + '/'
  if (!root) {
    root = calling
  }
  else {
    if (!path.isAbsolute(root)) {
      root = path.normalize(calling + root)
    }
  }

  // settings path
  const support = path.normalize(root + '/' + (storage || 'storage') + '/')
  settingsPath = support + 'sketchpad/settings.json'

  sketchpad = {
    // properties
    root: root,
    settings: {},
    paths: [],

    // methods
    load: load,
    watch: watch
  }

  // settings
  sketchpad.load()

  // return
  return sketchpad
}

let settingsPath = ''
let sketchpad = {}

module.exports = init
