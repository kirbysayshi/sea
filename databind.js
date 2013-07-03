var sea = module.exports = require('./index')
  , dom = require('./domutil')


sea._cmpBindings = {};
sea._templates = {}
sea._boundComputeds = {};


exports.applyBindings = sea.applyBindings = function(model, opt_el){
  var el = opt_el || document.body;

  var rootModel = model.$root || model;

  dom.breadthChildren(el, function(node){

    var controlsChildren = false
      , bindAttrs = exports.getBindingAttributes(node);

    if(bindAttrs.length){

      // create a computed for each binding
      bindAttrs.forEach(function(name){
        var currNode = node // closure for loop
          , cmpBinding = exports.compileBinding(currNode.getAttribute('data-' + name), model);

        // only call init if it's defined. It's unneccessary in many cases
        if(sea.bindings[name].init){
          sea.bindings[name].init(currNode, cmpBinding, rootModel, model);
        }

        // creates a computed that calls the binding's update
        exports.boundComputedFor(currNode, name, cmpBinding, rootModel, model);
      });

      // determine if any binding has claimed to control children
      controlsChildren = bindAttrs.some(function(name){
        return sea.bindings[name].controlsChildren;
      });
    }

    // if this binding does not control children, return not false to continue
    // visiting children
    return !controlsChildren;
  })
}


exports.destroyBindings = sea.destroyBindings = function(el){

  dom.breadthChildren(el, function(node){

    var computeds
      , names
      , id

    // kill cached compiled bindings
    exports.getBindingAttributes(node).forEach(function(name){
      delete sea._cmpBindings[node.getAttribute('data-' + name)];
    })

    if(node.dataset && (id = node.dataset.seaid)){

      // grab computeds for a particular id, this should be an object
      // of keys that correspond to binding names
      computeds = sea._boundComputeds[id];

      if(computeds){

        Object.keys(computeds).forEach(function(name){
          // prevent it from receiving updates
          computeds[name].self.destroy();
        })

        // delete the cache to the named computeds
        delete sea._boundComputeds[id];
      }
    }
  })
}


exports.compileBinding = sea.compileBinding = function(bindingText, context){
  context = context || {};

  var keys = Object.keys(context)
    , args = keys.slice();

  var fnText = ';return ' + bindingText;

  args.push(fnText);

  var fn = sea._cmpBindings[bindingText] || Function.apply(null, args);
  sea._cmpBindings[bindingText] = fn;

  return function(){
    var keyValues = keys.map(function(key){ return context[key] });
    return fn.apply( null, keyValues );
  }
}


exports.templateFor = sea.templateFor = function(el){
  var id = dom.idFor(el);

  var template = sea._templates[id];

  if(!template){
    var stamper = document.createDocumentFragment()
      , children = dom.slice(el.childNodes)
    children.forEach(function(el){ stamper.appendChild(el); });
    template = sea._templates[id] = stamper;
  }

  return template;
}


exports.boundComputedFor = sea.boundComputedFor = function(el, bindingName, cmpBinding, rootModel, currentModel){
  var id = dom.idFor(el);

  var boundComputeds = (sea._boundComputeds[id] = sea._boundComputeds[id] || {})

  if(boundComputeds[bindingName]){
    return boundComputeds[bindingName];
  }

  boundComputeds[bindingName] = sea.computed(function(){
    return sea.bindings[bindingName].update(el, cmpBinding, rootModel, currentModel);
  });

  return boundComputeds[bindingName];
}


exports.getBindingAttributes = sea.getBindingAttributes = function(node){
  var bindNames = Object.keys(sea.bindings);

  var attrs = bindNames.filter(function(name){
    return node.getAttribute && node.getAttribute('data-' + name);
  })

  return attrs;
}