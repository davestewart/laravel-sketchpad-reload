# Sketchpad Reload

Sketchpad Reload is Node module that provides file watching and live-reloading capability for [Laravel Sketchpad](https://github.com/davestewart/laravel-sketchpad).

By default it:

- watches all controller, asset and view folders
- reloads changes to loaded scripts and styles
- re-runs the current method if the controller is updated
- re-runs the current method when additionally-watched files are updated, added or deleted
- reloads the navigation when any controllers updated, added or deleted

Sketchpad Reload also runs as a standalone script – no need to integrate with any build processes!


## Express Setup


If you...
 
- have a standard Laravel setup
- your `node_modules` folder is (or would be) in your application's root
- you're running a standard Homestead or XAMPP install

...you can be up and running in under 30 seconds.

### Install

From your application root, install and create the task script:

    npm install sketchpad-reload
    echo "require('sketchpad-reload').watch()" > sketchpad.js

This will create a new file in your root folder called `sketchpad.js`.

### Configure

Now, load Sketchpad and configure the module from the [settings](https://github.com/davestewart/laravel-sketchpad/wiki/Settings) page:

![image](https://cloud.githubusercontent.com/assets/132681/24477868/9fb9b4e2-14d0-11e7-806a-a72472e6678d.png)

Choose "local" or "virtual" machine as required, which will save the required settings to disk.

### Run

Finally, run the installation from your application root by calling the `sketchpad.js` script like so:

    node sketchpad.js

You should see something like the following, indicating LiveReload is running and files are being watched:

![image](https://cloud.githubusercontent.com/assets/132681/24477964/fcd25a62-14d0-11e7-9993-c98408873e7e.png)



# Custom setup

If you want to install Sketchpad Reload to a custom folder or your `storage/` folder is non-standard, you'll need to configure the module so it knows where things are.

For this example, we're going to install Sketchpad Reload in the custom Sketchpad installation folder `sketchpad/`, and pretend the `storage/` folder is in a subfolder of the main install:

    +- myawesomesite.dev
        +- app
        +- ...
        +- sketchpad     <- sketchpad installation folder
        +- support
        |   +- storage   <- storage folder
        +- ...

## Install

First, install the module in the `sketchpad/` folder:

    cd sketchpad
    npm install sketchpad-reload

Now, create a new, default task script...

    touch index.js
    
...and copy this code to it:

    var sketchpad = require('sketchpad-reload')
    var server = sketchpad('../', 'support/storage')
    server.watch()

In the above snippet, see how the the first and second arguments to the `sketchpad()` function tell it the location of:

- the Laravel root folder (relative or absolute to the module)
- the Laravel storage folder (relative to the Laravel root)

**You should edit these parameters as required for your setup.**


## Configure

With the module installed and the task script created, load Sketchpad and configure the module from the [settings](https://github.com/davestewart/laravel-sketchpad/wiki/Settings) page:

![sketchpad-reload-settings](https://cloud.githubusercontent.com/assets/132681/24475693/b25c5314-14c8-11e7-9575-d434fa95594c.png)


Configuration depends primarily on:
 
1. how you're **hosting** the site you're running Sketchpad on
2. whether you run the task script from the **local** or **virtual** machine

### Setup options

There are 3 presets to choose from which work with a Laravel Homestead, localhost, or custom configuration.

**No reloading** disables all LiveReload integration from Sketchpad.

**Run from local machine** configures these options:

    host        : "localhost"
    usePolling  : false


**Run from virtual machine** configures these options:

    host        : <your configured hostname>
    usePolling  : true


**Custom** allows you to configure the options how you like:

    host        : "myawesomesite.dev"
    usePolling  : false // set to true for VM setups!

All configuration options will be passed to the Node [LiveReload](https://github.com/livereload/livereload-js) instance.


### Run

You should now be able to run Sketchpad Reload from the root of your app:

    cd ..
    node sketchpad

Note that there is no need for `.js` this time, as we're asking node to run the default script in the `sketchpad` folder.

If subsequent changes in your Sketchpad files don't appear to reload, you can come back to the settings page and make additional changes. The Sketchpad Reload module will **automatically reload** when it detects changes in the LiveReload setup.

## Additional paths

You may have noticed that the Sketchpad settings page allows you to configure **Additional paths** to watch. These can trigger Sketchpad to reload when changes in related files are detected. 

For example, you might be working on some code which requires your application's `services` or `models`, and you need your development code to update with those changes when they change.

Simply add those folders as so:

    app/Services
    app/Models

Any changes to files in those folders will trigger Sketchpad to re-run any current controller methods you may be working on.


## Troubleshooting

If your files aren't reloading:
 
- make sure you have the correct host for your development setup
- make sure polling is on for VM setups
- ensure your paths are root-relative, i.e. `app/Services` not `/app/Services`
- don't add wildcards (the module will do this for you) so `assets` not `assets/*.css`

