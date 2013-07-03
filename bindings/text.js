
exports.init = function(el, cmpAttr){
  el.textContent = cmpAttr();
}

exports.update = function(el, cmpAttr){
  el.textContent = cmpAttr();
}
