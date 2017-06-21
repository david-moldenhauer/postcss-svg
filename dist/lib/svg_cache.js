(function() {
  var SVGImage, _, fs, path,
    slice = [].slice;

  SVGImage = require('./svg_image');

  _ = require('lodash');

  path = require('path');

  fs = require('fs');

  module.exports = {
    defaultPaths: ['svg'],
    init: function(options) {
      var debug, filename, i, j, len, len1, myPath, ref, ref1, stat, svgOptions;
      debug = _.isBoolean(options.debug) && options.debug;
      options.svgo || (options.svgo = false);
      this.templates = {};
      this.filesIndex = {};
      if (debug) {
        console.time('Index generation');
      }
      if (!_.isBoolean(options.ei) || options.ei) {
        this.addToIndex('ei.svg', {
          content: require('evil-icons').sprite,
          defaults: (options.ei && options.ei.defaults) || options.defaults,
          svgo: options.svgo,
          sprite: {
            postfix: '-icon',
            prefix: 'ei-'
          }
        });
      }
      svgOptions = _.pick(options, 'defaults', 'svgo');
      ref = options.paths || this.defaultPaths;
      for (i = 0, len = ref.length; i < len; i++) {
        myPath = ref[i];
        if (fs.existsSync(myPath)) {
          stat = fs.statSync(myPath);
          if (stat.isDirectory()) {
            ref1 = fs.readdirSync(myPath);
            for (j = 0, len1 = ref1.length; j < len1; j++) {
              filename = ref1[j];
              this.addToIndex("" + myPath + path.sep + filename, svgOptions);
            }
          } else {
            if (stat.isFile()) {
              this.addToIndex(myPath, svgOptions);
            }
          }
        }
      }
      if (debug) {
        return console.timeEnd('Index generation');
      }
    },
    addToIndex: function(filePath, options) {
      var base, basename, basenameWithExt, error, svg;
      if (options == null) {
        options = {};
      }
      if (path.extname(filePath) === '.svg') {
        try {
          svg = new SVGImage(filePath, options);
        } catch (error1) {
          error = error1;
          console.log(filePath + " will not parse properly please check the markup");
        }
        basename = path.basename(filePath, '.svg');
        basenameWithExt = basename + ".svg";
        if (this.filesIndex[basename]) {
          this.filesIndex[basenameWithExt] = this.filesIndex[basename] = this.filesIndex[basename].error ? ((base = this.filesIndex[basename]).paths || (base.paths = []), this.filesIndex[basename].paths.push(svg.path)) : {
            error: true,
            livel: 'Warning',
            getMessage: function() {
              return "You have some files with this basename: " + (this.paths.join(', '));
            },
            paths: [this.filesIndex[basename].path, svg.path]
          };
        } else {
          this.filesIndex[basename] = this.filesIndex[basenameWithExt] = svg;
        }
        return this.filesIndex[filePath] = this.filesIndex[filePath.slice(0, -4)] = svg;
      }
    },
    get: function(identifier) {
      var ids, link, ref, svg;
      ref = identifier.split('#'), link = ref[0], ids = 2 <= ref.length ? slice.call(ref, 1) : [];
      if (svg = this.filesIndex[link]) {
        if (svg.error) {
          throw svg.getMessage();
        } else {
          return svg.svgFor(ids);
        }
      } else {
        throw "'" + link + "' not found in SVG cache";
      }
    }
  };

}).call(this);
