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

function error (str) {
  console.log(colors.red('\nERROR! ' + str + '\n'))
  return false
}

function log (value) {
  const values = Array.prototype.slice.call(arguments).join(' ')
  console.log(timestamp() + ' ' + values)
}

function logBullet (title, value) {
  !value
    ? console.log('  - ' + colors.cyan(title))
    : console.log('  - ' + title + ': ' + colors.cyan(value))
}

function makeGlob (path, ext) {
  return path.replace(/\/*$/, '/') + '**/*' + (ext || '')
}

function pad (str, length) {
  str = String(str)
  while (str.length < length) str += ' '
  return str
}

function getCallingScript() {
  const lines = stack()
  const thisFile = lines.shift().getFileName();
  while (lines.length) {
    let nextFile = lines.shift().getFileName()
    if (nextFile !== thisFile) {
      return nextFile
    }
  }
  error('Unable to determine calling module')
  return thisFile;
}

// ------------------------------------------------------------------------------------------------
// helpers
// ------------------------------------------------------------------------------------------------

function getPaths (settings) {
  return settings.paths.controllers
    .filter(obj => obj.enabled)
    .map(obj => obj.path)
    .concat(settings.paths.assets)
    .concat(settings.paths.views)
    .concat(settings.livereload.paths)
    .sort()
}

// ------------------------------------------------------------------------------------------------
// main
// ------------------------------------------------------------------------------------------------

/**
 * Set up servers and watches
 *
 * @see https://www.npmjs.com/package/livereload
 * @see https://github.com/paulmillr/chokidar
 */
function watch () {
  // initialize
  if (!this.root) {
    if(!this.init()) {
      return
    }
  }

  // properties
  const root = this.root
  const paths = [].concat(this.paths)
  const settings = this.settings
  const options = {
    usePolling: settings.usePolling,
    ignoreInitial: true
  }

  // log
  log('Starting Sketchpad Reload...')
  console.log('\nSettings:\n')
  logBullet('host', settings.host)
  logBullet('root', root)
  logBullet('mode', settings.usePolling ? 'polling' : 'watching')
  console.log('\nFolders:\n')
  paths.forEach(p => logBullet(p.replace(root, '')))
  console.log()

  // livereload server, but without watches
  const server = livereload.createServer({start: true})

  // callbacks
  const reload = (file, type) => {
    file = file.replace(root, '')
    log(pad('[' + type + ']', 8) + ' > ' + colors.cyan(file))
    server.refresh(type + ':' + file)
  }

  const restart = () => {
    this.load()
    if (JSON.stringify(settings) !== JSON.stringify(this.settings)) {

      // close chokidars
      wp.close()
      ws.close()

      // hack to prevent errors on closing non-watched server
      if (server.watcher) {
        server.close();
      } else {
        server.server._server.close();
        server.server.close();
      }

      // restart
      setTimeout(this.watch.bind(this), 500)
    }
  }

  // restart when settings changes
  const ws = chokidar
    .watch(settingsFile, options)
    .on('change', restart)

  // watch configured paths
  const wp = chokidar
    .watch(paths, options)
    .on('add', file => reload(file, 'add'))
    .on('change', file => reload(file, 'change'))
    .on('unlink', file => reload(file, 'delete'))
}

/**
 * Load the settings file contents and assign to properties
 *
 * @returns {boolean}
 */
function load () {
  const str = fs.readFileSync(settingsFile, 'utf8')
  if (str) {
    const settings = JSON.parse(str)
    this.settings = settings.livereload
    this.paths = getPaths(settings)
      .map(p => path.normalize(this.root + '/' + p))
      .map(p => makeGlob(p))
  }
}

/**
 * Initialize Sketchpad, optionally with non-standard paths
 *
 * @param   {string}  [root]      Relative path to Laravel root folder
 * @param   {string}  [storage]   Relative path to storage folder from root
 * @returns {boolean}
 */
function init (root, storage) {
  // calling path
  const calling = path.dirname(getCallingScript())

  // root path
  root = !root || root === '.' || root === './'
    ? root = calling
    : path.isAbsolute(root)
      ? root
      : path.normalize(calling + root)
  sketchpad.root = root.replace(/\/*$/, '/')

  // settings path
  const settingsFolder = path.normalize(sketchpad.root + (storage || 'storage') + '/sketchpad/')
  settingsFile = settingsFolder + 'settings.json'

  // check for settings
  if (!fs.existsSync(settingsFolder)) {
    return error('Folder "' +settingsFolder+ '" not found')
  }
  if (!fs.existsSync(settingsFile)) {
    return error('File "settings.json" not found in "' +settingsFolder+ '"')
  }

  // load settings
  sketchpad.load()
  return this
}

// ------------------------------------------------------------------------------------------------
// main

let settingsFile = ''
let sketchpad = {
  root: null,
  paths: [],
  settings: {},
  init: init,
  load: load,
  watch: watch
}

module.exports = sketchpad
