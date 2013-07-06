
var dom = require('../domutil')

exports.init = function(el, cmpAttr, rootModel, currentModel){
  var accessor = cmpAttr();
  dom.evman.on(el, 'keyup', function(e){
    accessor(el.value);
  })
}

exports.update = function(el, cmpAttr , rootModel, currentModel){
  var accessor = cmpAttr();
  if(accessor() !== el.value){
    el.value = accessor();
  }
}