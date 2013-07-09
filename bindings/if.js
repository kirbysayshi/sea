var databind = require('../databind')
  , dom = require('../domutil')
  , sea = require('../index')

exports.controlsChildren = true;

exports.init = function(el, cmpAttr, rootModel, currentModel){
  // consume the children as a template
  databind.templateFor(el);
}
exports.update = function(el, cmpAttr, rootModel, currentModel){

  var test = cmpAttr()
    , template = databind.templateFor(el)
    , newModel;

  // something has changed, so destroy all children and their databind
  sea.slice(el.childNodes).forEach(function(child){
    databind.destroyBindings(child);
    el.removeChild(child);
  })

  // binding returns truthy...
  if(test){
    template = template.cloneNode(true);

    el.appendChild(template);
    sea.slice(el.childNodes).forEach(function(child){
      databind.applyBindings(currentModel, child);
    })
  }
}