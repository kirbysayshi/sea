var databind = require('../databind')
  , dom = require('../domutil')

exports.controlsChildren = true;

exports.init = function(el, cmpAttr){
  // consume the children as a template
  databind.templateFor(el);
}
exports.update = function(el, cmpAttr, rootModel, currentModel){

  var test = cmpAttr()
    , template = databind.templateFor(el)
    , newModel;

  // something has changed, so destroy all children and their databind
  dom.slice(el.childNodes).forEach(function(child){
    databind.destroyBindings(child);
    el.removeChild(child);
  })

  if(test){
    // binding returns truthy...

    el.appendChild(template);
    dom.slice(el.childNodes).forEach(function(child){
      databind.applyBindings(currentModel, child);
    })
  }
}