var sea = sea || require('./index.js');

sea.applyBindings = function(model, opt_el){
  var el = opt_el || document.body;

  var bindNames = Object.keys(sea.bindings);

  function getBindAttrs(node){
    var attrs = bindNames.filter(function(name){
      return node.getAttribute && node.getAttribute('data-' + name);
    })

    return attrs;
  }

  var nodes = [el]
    , node
    , bindAttrs
    , controlsChildren

  while(nodes.length){
    node = nodes.shift();

    controlsChildren = false;
    bindAttrs = getBindAttrs(node);

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

    // only push child nodes for processing if they exist and nothing
    // else claims to control children
    if(node.childNodes && node.childNodes.length && !controlsChildren){
      nodes.push.apply(nodes, node.childNodes);
    }
  }
}

sea.destroyBindings = function(el){
  var nodes = [el]
    , node
    , id
    , computed;

  while(nodes.length){
    node = nodes.shift();
    if(node.dataset && (id = node.dataset.seaid)){

      computed = sea._boundComputeds[id];

      if(computed){
        // delete the cache to the bound computed
        delete sea._boundComputeds[id];

        // prevent it from receiving updates
        computed.self.destroy();
      }
    }

    node.childNodes && node.childNodes.length
      && nodes.push.apply(nodes, node.childNodes);
  }
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
  var id = el.dataset.seaid;

  if(!id){
    id = el.dataset.seaid = sea.guid('nde');
  }

  var template = sea._templates[id];

  if(!template){
    var stamper = document.createDocumentFragment()
      , children = Array.prototype.slice.call(el.childNodes)
    children.forEach(function(el){ stamper.appendChild(el); });
    template = sea._templates[id] = stamper;
  }

  return template;
}


sea._boundComputeds = {};

sea.boundComputedFor = function(el, bindingName, cmpBinding){
  var id = el.dataset.seaid;

  if(!id){
    id = el.dataset.seaid = sea.guid('nde');
  }

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

sea.bindings.foreach.init = sea.bindings.foreach.update = function(el, cmpAttr){
  var items = cmpAttr()
    // very important that this come before call to children
    , stamper = sea.templateFor(el)
    // .templateFor removes the children if there is no cached template,
    // meaning only two outcomes: there is a template, or there are existing
    // rendered child nodes
    , children = Array.prototype
        .slice.call(el.childNodes)
        .filter(function(node){ return node.nodeType !== 3 })
    , all = document.createDocumentFragment();

  items.forEach(function(item, i){
    var node = children[i] || stamper.cloneNode(true);

    var model = {};
    model.$parent = cmpAttr;
    model.$data = item;
    model.$index = i;
    sea.applyBindings(model, node);

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
