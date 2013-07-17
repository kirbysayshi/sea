
exports.update = function(el, cmpAttr){
  var styleObj = cmpAttr()
    , styleProps = Object.keys(styleObj);

  styleProps.forEach(function(prop) {
    var styleVal = styleObj[prop];
    el.style[prop] = typeof styleVal === 'function'
      ? styleVal()
      : styleVal;
  });
}