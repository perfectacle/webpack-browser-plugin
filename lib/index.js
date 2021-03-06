'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var os = _interopDefault(require('os'));

var babelHelpers = {};

babelHelpers.classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

babelHelpers.createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

babelHelpers;

var aix = {};
var darwin = { "google": { "app": "google chrome" }, "firefox": { "app": "firefox" } };
var freebsd = {};
var linux = { "google": { "app": "google-chrome" } };
var openbsd = {};
var sunos = {};
var win32 = { "google": { "app": "chrome" }, "firefox": { "app": "firefox" } };
var OsBrowsers = {
	aix: aix,
	darwin: darwin,
	freebsd: freebsd,
	linux: linux,
	openbsd: openbsd,
	sunos: sunos,
	win32: win32
};

function mergeOptions(options, defaults) {
  for (var key in defaults) {
    if (options.hasOwnProperty(key)) {
      defaults[key] = options[key];
    }
  }
  return defaults;
}

var WebpackBrowserPlugin = function () {
  function WebpackBrowserPlugin(options) {
    babelHelpers.classCallCheck(this, WebpackBrowserPlugin);

    var defaultOptions = {
      port: 8080,
      browser: 'default',
      url: 'http://127.0.0.1',
      publicPath: '',
      openOptions: null,
      bsOptions: null
    };
    if (options) {
      this.options = mergeOptions(options, defaultOptions);
    } else {
      this.options = defaultOptions;
    }
    this.firstRun = true;
    this.watch = false;
    this.dev = null;
    this.outputPath = null;
  }

  babelHelpers.createClass(WebpackBrowserPlugin, [{
    key: 'browserStr',
    value: function browserStr(browser) {
      browser = browser.toLowerCase();
      var valid = false;
      if (browser.indexOf('google') > -1 || browser.indexOf('chrome') > -1) {
        if (OsBrowsers[os.platform()].google) {
          browser = OsBrowsers[os.platform()].google.app;
          valid = true;
        }
      }
      if (browser.indexOf('fire') > -1 || browser.indexOf('fox') > -1) {
        if (OsBrowsers[os.platform()].firefox) {
          browser = OsBrowsers[os.platform()].firefox.app;
          valid = true;
        }
      }
      return { browser: browser, valid: valid };
    }
  }, {
    key: 'buildUrl',
    value: function buildUrl(options) {
      if (!! ~options.url.indexOf('${port}')) {
        var url = options.url.replace('${port}', ':' + options.port);
        return url + '/' + this.options.publicPath;
      } else {
        return options.url + ':' + options.port.toString() + '/' + this.options.publicPath;
      }
    }
  }, {
    key: 'apply',
    value: function apply(compiler) {
      var _this = this;

      if (compiler.options.output.publicPath) {
        this.options.publicPath = WebpackBrowserPlugin.cleanPublicPath(compiler.options.output.publicPath);
      }
      if (compiler.options.port) {
        this.options.port = compiler.options.port;
      } else if (compiler.options.devServer) {
        if (compiler.options.devServer.port) {
          this.options.port = compiler.options.devServer.port;
        }
      }

      compiler.plugin('compilation', function (compilation) {
        if (compilation.options.watch) {
          _this.watch = true;
        }
        if (compilation.compiler._plugins['watch-run']) {
          _this.dev = true;
        } else {
          _this.dev = false;
          _this.outputPath = compilation.compiler.outputPath;
          console.log('outputPath', _this.outputPath);
        }
      });

      compiler.plugin('done', function (compilation) {
        if (_this.firstRun) {
          if (_this.dev === true) {
            var open = require('opn');
            var url = _this.buildUrl(_this.options);
            var results = _this.browserStr(_this.options.browser);
            if (_this.options.openOptions) {
              open(url, _this.options.openOptions);
            } else {
              if (results.valid) {
                open(url, { app: results.browser });
              } else {
                open(url);
                if (results.browser !== 'default') {
                  console.log('Given browser params: \'' + _this.options.browser + '\' were not valid or available. Default browser opened.');
                }
              }
            }
          } else if (_this.dev === false) {
            (function () {
              var bs = require('browser-sync').create();

              if (_this.watch) {
                bs.watch(_this.outputPath + '/**/*.js', function (event, file) {
                  if (event === "change") {
                    bs.reload();
                  }
                });
              }
              bs.init(_this.buildBSServer());
            })();
          } else {
            console.log('Failed Plugin: Webpack-Broswer-Plugin, incorrect params found.');
          }
          _this.firstRun = false;
        }
      });
    }
  }, {
    key: 'buildBSServer',
    value: function buildBSServer() {
      var server = [this.outputPath];
      if (this.options.publicPath && this.options.publicPath !== '') {
        server.push(this.outputPath + '/' + this.options.publicPath);
      }
      var bsOptions = {
        server: server,
        browser: this.options.browser,
        port: this.options.port,
        open: 'internal'
      };
      if (this.options.publicPath) {
        bsOptions.startPath = this.options.publicPath;
      }
      if (this.options.bsOptions) {
        bsOptions = this.options.bsOptions;
      }
      return bsOptions;
    }
  }], [{
    key: 'cleanPublicPath',
    value: function cleanPublicPath(str) {
      var arr = str.split('');
      if (arr[0] === '/') {
        arr.splice(0, 1);
      }
      if (arr[arr.length - 1] === '/') {
        arr.splice(arr.length - 1, 1);
      }
      return arr.join('');
    }
  }]);
  return WebpackBrowserPlugin;
}();

module.exports = WebpackBrowserPlugin;