
exports.init = function(el, cmpAttr){}

exports.update = function(el, cmpAttr){

  var classNamesObj = cmpAttr()
    , classNames = Object.keys(classNamesObj);

  classNames.forEach(function(name){
    if(classNamesObj[name]){
      // truthy, add class
      el.classList.add(name);
    } else {
      el.classList.remove(name);
    }
  })
}