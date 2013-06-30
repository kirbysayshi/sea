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

// retrieves or sets and retrieves an id for a dom element
sea.dom.idFor = function(el){
  var prefix = 'nde';
  if(el.dataset){
    return el.dataset.seaid || (el.dataset.seaid = sea.guid(prefix))
  } else {
    return el.seaid || (el.seaid = sea.guid(prefix))
  }
}

sea.dom.getBindingAttributes = function(node){
  var bindNames = Object.keys(sea.bindings);

  var attrs = bindNames.filter(function(name){
    return node.getAttribute && node.getAttribute('data-' + name);
  })

  return attrs;
}

sea.applyBindings = function(model, opt_el){
  var el = opt_el || document.body;

  var rootModel = model.$root || model;

  sea.dom.breadthChildren(el, function(node){

    var controlsChildren = false
      , bindAttrs = sea.dom.getBindingAttributes(node);

    if(bindAttrs.length){

      // create a computed for each binding
      bindAttrs.forEach(function(name){
        var currNode = node // closure for loop
          , cmpBinding = sea.compileBinding(currNode.getAttribute('data-' + name), model);

        // only call init if it's defined. It's unneccessary in many cases
        if(sea.bindings[name].init){
          sea.bindings[name].init(currNode, cmpBinding, rootModel, model);
        }

        // creates a computed that calls the binding's update
        sea.boundComputedFor(currNode, name, cmpBinding, rootModel, model);
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

    var computeds
      , names
      , id

    // kill cached compiled bindings
    sea.dom.getBindingAttributes(node).forEach(function(name){
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


sea._cmpBindings = {};

sea.compileBinding = function(bindingText, context){
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

sea.boundComputedFor = function(el, bindingName, cmpBinding, rootModel, currentModel){
  var id = sea.dom.idFor(el);

  var boundComputeds = (sea._boundComputeds[id] = sea._boundComputeds[id] || {})

  if(boundComputeds[bindingName]){
    return boundComputeds[bindingName];
  }

  boundComputeds[bindingName] = sea.computed(function(){
    return sea.bindings[bindingName].update(el, cmpBinding, rootModel, currentModel);
  });

  return boundComputeds[bindingName];
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
sea.bindings.foreach.modelFor = function(el, parent, data, index, rootModel){
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
  model.$root = rootModel;

  // ... and cache it for later
  sea.bindings.foreach._models[id] = model;

  return model;
}

sea.bindings.foreach.elModelWillChange = function(el, parent, data, index, rootModel){
  var id = sea.dom.idFor(el);
  var model = sea.bindings.foreach._models[id];

  return !(
    model
    && model.$parent === parent
    && model.$data === data
    && model.$index === index
    && model.$root === rootModel
  )
}

sea.bindings.foreach.init = function(){}
sea.bindings.foreach.update = function(el, cmpAttr, rootModel, currentModel){
  var items = cmpAttr()
    // very important that this come before call to children
    // .templateFor removes the children if there is no cached template,
    // meaning only two outcomes: there is a template, or there are existing
    // rendered child nodes
    , stamper = sea.templateFor(el)

  // memoize and allow for lazy creation/eval
  var _childNodes = null;
  function childNodes(){
    if(!_childNodes){
      _childNodes = sea.dom.onlyElementNodes(sea.slice(el.childNodes))
    }

    return _childNodes;
  }

  // memoize and allow for lazy creation/eval
  var _fragment = null;
  function fragment(){
    if(!_fragment){
      _fragment = document.createDocumentFragment();
    }
    return _fragment;
  }

  items.forEach(function(item, i){
    var node = childNodes()[i]
      , willChange
      , nodes;

    if(!node){
      // node is a document fragment
      node = stamper.cloneNode(true);
    }

    if(node.nodeType === Node.DOCUMENT_FRAGMENT_NODE){
      // we only care about the children, otherwise an id would be assigned to
      // the fragment, which is ethereal and will be discarded
      nodes = sea.slice(node.childNodes);
    } else {
      // it's just a normal node
      nodes = [node]
    }

    // "Templates" can contain multiple nodes without a container.
    // each node will be assigned a unique id, and different model instances
    // with the same data
    nodes.forEach(function(node){
      willChange = sea.bindings.foreach.elModelWillChange(node, currentModel, item, i, rootModel);

      if(willChange){
        // cache/update the model, and apply child bindings
        var model = sea.bindings.foreach.modelFor(node, currentModel, item, i, rootModel);
        sea.applyBindings(model, node);
      }

      fragment().appendChild(node);
    })
  });

  // batch operation
  if(fragment().childNodes.length){
    el.appendChild(fragment());
  }
}


sea.bindings.css = {}
sea.bindings.css.init = function(el, cmpAttr){}
sea.bindings.css.update = function(el, cmpAttr){

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


sea.bindings.if = { controlsChildren: true };
sea.bindings.if.init = function(el, cmpAttr){
  // consume the children as a template
  sea.templateFor(el);
}
sea.bindings.if.update = function(el, cmpAttr, rootModel){

  var test = cmpAttr()
    , template = sea.templateFor(el)
    , newModel;

  // something has changed, so destroy all children and their bindings
  sea.slice(el.childNodes).forEach(function(child){
    sea.destroyBindings(child);
    el.removeChild(child);
  })

  if(test){
    // binding returns truthy...

    // TODO: model?

    el.appendChild(template);
    sea.slice(el.childNodes).forEach(function(child){
      sea.applyBindings(rootModel, child);
    })
  }
}

module.exports = sea;
