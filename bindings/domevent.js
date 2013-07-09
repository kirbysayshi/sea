
var dom = require('../domutil')

module.exports = function(evname){
  return function(el, cmpAttr, rootModel, currentModel){
    var accessor = cmpAttr();
    dom.evman.on(el, 'evname', function(e){
      accessor(currentModel.$data || currentModel, el, e);
    })
  }
}