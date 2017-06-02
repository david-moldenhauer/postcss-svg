postcss = require 'postcss'
SVGCache = require('./lib/svg_cache')
_ = require('lodash')

module.exports = postcss.plugin "postcss-svg", (options = {}) ->
  funcName = options.func || 'svg'
  SVGRegExp = new RegExp("#{funcName}\\(\"([^\"]+)\"(,\\s*\"([^\"]+)\")?\\)")
  silent = if _.isBoolean(options.silent) then options.silent else true
  silent = false if options.debug
  
  (style) ->
    SVGCache.init(options)

    style.walkDecls /^background|^filter|^content|image$/, (decl) ->
      return unless decl.value
      if matches = SVGRegExp.exec(decl.value.replace(/'/g, '"'))
        [replace, args...] = matches
        [name, params...] = args
        if !~name.indexOf('ei#')
          file = style.source && style.source.input && style.source.input.file
          name = file.substr(0, file.lastIndexOf('/')+1)+name
          if !~name.indexOf('.svg')
            name += '.svg'
          options.paths.push(name)
          SVGCache.init(options)
        console.time ("Render svg #{name}") if options.debug
        try
          svg = SVGCache.get(name)
        catch error
          throw decl.error(error) unless silent
        return unless svg
        decl.value = decl.value.replace replace, svg.dataUrl(params[1])
        console.timeEnd ("Render svg #{name}") if options.debug
        return
