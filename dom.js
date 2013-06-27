var sea = sea || require('./index.js');

sea.slice = function(nodeList){ return Array.prototype.slice.call(nodeList) }

sea.dom = {};

sea.dom.select = function(selector, context){
  context = context || document;
  return sea.slice(context.querySelectorAll(selector));
}

sea.dom.onlyElementNodes = function(list){
  return list.filter(function(node){
    return node.nodeType === 1;
  })
}

// return false to not add childnodes
sea.dom.breadthChildren = function(el, cb){
  var nodes = [el]
    , node
    , ret
  while(nodes.length){
    node = nodes.shift();

    ret = cb(node);

    if(ret !== false && node.childNodes){
      nodes.push.apply(nodes, node.childNodes);
    }
  }
}

sea.dom.idFor = function(el){
  if(el.dataset){
    return el.dataset.seaid || (el.dataset.seaid = sea.guid('nde'))
  } else {
    return el.seaid || (el.seaid = sea.guid('nde'))
  }
}

sea.applyBindings = function(model, opt_el){
  var el = opt_el || document.body;

  var bindNames = Object.keys(sea.bindings);

  function getBindAttrs(node){
    var attrs = bindNames.filter(function(name){
      return node.getAttribute && node.getAttribute('data-' + name);
    })

    return attrs;
  }

  sea.dom.breadthChildren(el, function(node){

    var controlsChildren = false
      , bindAttrs = getBindAttrs(node);

    if(bindAttrs.length){

      // create a computed for each binding
      bindAttrs.forEach(function(name){
        var currNode = node // closure for loop
          , cmpBinding = sea.compileBinding(currNode.getAttribute('data-' + name), model);

        sea.bindings[name].init(currNode, cmpBinding);

        // creates a computed that calls the binding's update
        sea.boundComputedFor(currNode, name, cmpBinding);
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

sea.destroyBindings = function(el){

  sea.dom.breadthChildren(el, function(node){

    var computed
      , id

    if(node.dataset && (id = node.dataset.seaid)){

      computed = sea._boundComputeds[id];

      if(computed){
        // delete the cache to the bound computed
        delete sea._boundComputeds[id];

        // prevent it from receiving updates
        computed.self.destroy();
      }
    }
  })
}


sea._cmpBindings = {};

sea.compileBinding = function(bindingText, context){
  context = context || {};

  var keys = Object.keys(context)
    , args = keys.slice();

  bindingText = ';return ' + bindingText;

  args.push(bindingText);

  var fn = sea._cmpBindings[bindingText] || Function.apply(null, args);
  sea._cmpBindings[bindingText] = fn;

  return function(){
    var keyValues = keys.map(function(key){ return context[key] });
    return fn.apply( null, keyValues );
  }
}


sea._templates = {}

sea.templateFor = function(el){
  var id = sea.dom.idFor(el);

  var template = sea._templates[id];

  if(!template){
    var stamper = document.createDocumentFragment()
      , children = sea.slice(el.childNodes)
    children.forEach(function(el){ stamper.appendChild(el); });
    template = sea._templates[id] = stamper;
  }

  return template;
}


sea._boundComputeds = {};

sea.boundComputedFor = function(el, bindingName, cmpBinding){
  var id = sea.dom.idFor(el);

  if(sea._boundComputeds[id]){
    return sea._boundComputeds[id];
  }

  sea._boundComputeds[id] = sea.computed(function(){
    return sea.bindings[bindingName].update(el, cmpBinding);
  });

  return sea._boundComputeds[id];
}


sea.bindings = {};

sea.bindings.text = {
  init: function(el, cmpAttr){
    el.textContent = cmpAttr();
  },
  update: function(el, cmpAttr){
    el.textContent = cmpAttr();
  }
}


sea.bindings.foreach = {};
sea.bindings.foreach.controlsChildren = true;

sea.bindings.foreach._models = {};
sea.bindings.foreach.modelFor = function(el, parent, data, index){
  var id = sea.dom.idFor(el);
  var model = sea.bindings.foreach._models[id] || {};

  // model hasn't changed, return it
  if(!sea.bindings.foreach.elModelWillChange(el, parent, data, index)){
    return model;
  }

  // model has changed, update properties...
  model.$parent = parent;
  model.$data = data;
  model.$index = index;

  // ... and cache it for later
  sea.bindings.foreach._models[id] = model;

  return model;
}

sea.bindings.foreach.elModelWillChange = function(el, parent, data, index){
  var id = sea.dom.idFor(el);
  var model = sea.bindings.foreach._models[id];

  return !(
    model
    && model.$parent === parent
    && model.$data === data
    && model.$index === index
  )
}

sea.bindings.foreach.init = function(){}
sea.bindings.foreach.update = function(el, cmpAttr){
  var items = cmpAttr()
    // very important that this come before call to children
    , stamper = sea.templateFor(el)
    // .templateFor removes the children if there is no cached template,
    // meaning only two outcomes: there is a template, or there are existing
    // rendered child nodes
    , children = sea.dom.onlyElementNodes(sea.slice(el.childNodes))
    , all = document.createDocumentFragment();

  items.forEach(function(item, i){
    var willChange
      , node = children[i];

    if(!node){
      // clone the template, and grab only the first Element child, ensuring
      // a single root element for each item
      node = sea.dom.onlyElementNodes(sea.slice(stamper.cloneNode(true).childNodes))[0];
      node.parentNode.removeChild(node);
    }

    willChange = sea.bindings.foreach.elModelWillChange(node, cmpAttr, item, i);

    if(willChange){
      // cache/update the model, and apply child bindings
      var model = sea.bindings.foreach.modelFor(node, cmpAttr, item, i);
      sea.applyBindings(model, node);
    }

    // if no parentNode, node must be new!
    if(!node.parentNode){
      all.appendChild(node);
    }
  });

  // batch operation
  if(all.childNodes.length){
    el.appendChild(all);
  }
}

module.exports = sea;
