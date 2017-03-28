"use strict"

// ------------------------------------------------------------------------------------------------
// libs

	// utils
	const argv    = require('yargs').argv,
    stack       = require('callsite'),
		chokidar    = require('chokidar'),
		colors		  = require('colors'),
		path		    = require('path')


// ------------------------------------------------------------------------------------------------
// utils

	function timestamp ()
	{
		const timestamp = (new Date()).toString().match(/\d{2}:\d{2}:\d{2}/)[0]
		return '[' + colors.gray(timestamp) + ']'
	}

	function log(value)
	{
		const values = Array.prototype.slice.call(arguments).join(' ')
		console.log(timestamp() + ' ' + values)
	}

	function logPaths(watcher, paths)
	{
		log('Starting', watcher)
    const verb = watchOptions.usePolling ? 'Polling' : 'Watching'
		log(verb + ' paths:')
		console.log(paths.map(p => '  - ' + colors.magenta(p)).join('\n'))
	}

  function makeGlob (path, ext)
  {
    ext = ext || ''
    return path.replace(/\/*$/, '/') + '**/*'
  }


// ------------------------------------------------------------------------------------------------
// livereload

	function livereload()
	{
	  // properties
    const root = this.root
    const livereload = require('livereload')

		// server
		function reload (file)
		{
			file = file.replace(root, '')
			log('change: ' + file)
			server.refresh('change:' + file, false)
		}

		// watch
    chokidar
      .watch(this.paths, watchOptions)
			.on('change', reload)
			.on('add', reload)
			.on('unlink', reload)

		// debug
		logPaths('LiveReload', this.paths)

	  // start
    const server = livereload.createServer({start: true})
	}

// ------------------------------------------------------------------------------------------------
// browsersync

  function browsersync (files, options)
	{
	  // properties
    const root = this.root
    const browsersync = require('browser-sync').create()
    let proxy = this.proxy || ''

		// defaults WORKS!
	  // url = http://localhost:3002/sketchpad/settings
		var defaults = {
    	//open: 'external',
      host: 'localhost',
      proxy: 'sketchpad.dev:80',
			//proxy: proxy,
			notify: true,
      logSnippet: true,
			ghostMode: false,
			watchOptions: watchOptions
		}

		// defaults
		defaults = {
    	//open: 'external',
      //host: 'localhost',
      proxy: 'sketchpad.dev:80',
			//proxy: proxy,
			notify: true,
      logSnippet: true,
			ghostMode: false,
			watchOptions: watchOptions
		}

		const defaultFiles = {
			match: this.paths,
			fn: function(event, file)
			{
				file = file.substr(root.length)
				log(event + ': ' + file);

        // run
				/\.(js|css)$/.test(file)
					? browsersync.reload(file)
					: this.sockets.emit('sketchpad:change', {type:event, file: file})
			}
		}

		// options
		files = files || []
		options = Object.assign(defaults, options)
		options.files = files.concat(defaultFiles)

		// debug
		logPaths('BrowserSync', files.concat(this.paths))
    console.log(options)

		// start
    browsersync.init(options)
	}

// ------------------------------------------------------------------------------------------------
// functions

  function getPaths (settings)
  {
    return settings.paths.controllers
      .filter(obj => obj.enabled)
      .map(obj => obj.path)
      .concat(settings.paths.assets)
      .concat(settings.paths.views)
      .map(path => makeGlob(path))
  }

  function start ()
  {
    const watcher = argv.browsersync
      ? 'browsersync'
      : argv.livereload
        ? 'livereload'
        : settings.watcher.toLowerCase()
    switch (watcher)
    {
      case 'browsersync':
        this.browsersync.apply(this, arguments)
        break
      case 'livereload':
        this.livereload.apply(this, arguments)
        break
      default:
        console.log('No file watcher assigned from Sketchpad')
    }
  }

// ------------------------------------------------------------------------------------------------
// variables

	// options
	const isVagrant     = process.env.PWD.indexOf('/vagrant/') > -1
	const watchOptions  = {usePolling: isVagrant || !!argv.usePolling}
	let settings


// ------------------------------------------------------------------------------------------------
// export

  module.exports = function (root, storage)
  {
    // wrangle roots
    const calling = path.dirname(stack()[1].getFileName()) + '/'
    if (!root) {
      root = calling
    }
    else {
      if (!path.isAbsolute(root)) {
        root = path.normalize(calling + root)
      }
    }

    // settings
    const support     = path.normalize(root + '/' + (storage || 'storage') + '/')

    // settings
    settings        = require(support + 'sketchpad/settings.json')

    // paths
    let paths       = getPaths(settings)
    let abspaths 	  = paths.map( p => path.normalize(root + '/' + p))

    // return
    return {
      root        : root,
      paths       : abspaths,
      start       : start,
      livereload  : livereload,
      browsersync : browsersync,
      proxy       : argv.proxy || '',
      server      : null
    }
  }
