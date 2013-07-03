var sea = module.exports = require('./index')

sea.dom = require('./domutil')

sea.bindings = {};
sea.bindings.value = require('./bindings/value')
sea.bindings.if = require('./bindings/if')
sea.bindings.css = require('./bindings/css')
sea.bindings.text = require('./bindings/text')
sea.bindings.foreach = require('./bindings/foreach')