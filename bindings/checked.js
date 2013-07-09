
var dom = require('../domutil')

exports.init = function(el, cmpAttr, rootModel, currentModel){
  var accessor = cmpAttr();
  dom.evman.on(el, 'change', function(e){
    accessor(el.checked);
  })
}

exports.update = function(el, cmpAttr , rootModel, currentModel){
  var accessor = cmpAttr();
  el.checked = accessor()
    ? true
    : false;
}