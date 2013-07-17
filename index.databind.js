var sea = module.exports = require('./index')

sea.dom = require('./domutil')

require('./databind');

sea.bindings = {};
sea.bindings.value = require('./bindings/value')
sea.bindings.if = require('./bindings/if')
sea.bindings.css = require('./bindings/css')
sea.bindings.text = require('./bindings/text')
sea.bindings.foreach = require('./bindings/foreach')
sea.bindings.checked = require('./bindings/checked')
sea.bindings.style = require('./bindings/style')

var domevent = sea.domevent = require('./bindings/domevent')

sea.bindings.click = domevent('click')
sea.bindings.dblclick = domevent('dblclick')
sea.bindings.keydown = domevent('keydown')
sea.bindings.keyup = domevent('keyup')