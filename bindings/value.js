
exports.init = function(el, cmpAttr, rootModel, currentModel){
  var accessor = cmpAttr();
  el.addEventListener('keyup', function(e){
    accessor(el.value);
  })
}

exports.update = function(el, cmpAttr , rootModel, currentModel){
  var accessor = cmpAttr();
  if(accessor() !== el.value){
    el.value = accessor();
  }
}