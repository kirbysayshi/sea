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
    //console.log(node, 'bindAttrs', bindAttrs, 'children', node.childNodes);

    if(bindAttrs.length){

      // create a computed for each binding
      bindAttrs.forEach(function(name){
        var currNode = node // closure for loop
          , cmpBinding = sea.compileBinding(currNode.getAttribute('data-' + name), model);

        sea.bindings[name].init(currNode, cmpBinding, model);

        sea.boundComputedFor(currNode, name, model);
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

sea.boundComputedFor = function(el, bindingName, opt_model){
  var id = el.dataset.seaid;

  if(!id){
    id = el.dataset.seaid = sea.guid('nde');
  }

  if(sea._boundComputeds[id]){
    return sea._boundComputeds[id];
  }

  opt_model = opt_model || {};

  var cmpBinding = sea.compileBinding(el.getAttribute('data-' + bindingName), opt_model);
  sea._boundComputeds[id] = sea.computed(function(){
    sea.bindings[bindingName].update(el, cmpBinding, opt_model);
    return opt_model;
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

sea.bindings.foreach = {

  controlsChildren: true,

  init: function(el, cmpAttr){
    //return false;
    var items = cmpAttr()
      , stamper = sea.templateFor(el)
      , all = document.createDocumentFragment();

    items.forEach(function(item, i){
      var model = {};
      model.$parent = cmpAttr;
      model.$data = item;
      model.$index = i;
      var clone = stamper.cloneNode(true);
      sea.applyBindings(model, clone);
      all.appendChild(clone);
    });

    el.appendChild(all);
  },

  update: function(el, cmpAttr){
    //return false;
    var items = cmpAttr()
      , children = Array.prototype
          .slice.call(el.childNodes)
          .filter(function(node){ return node.nodeType !== 3 })
      , stamper = sea.templateFor(el)

    items.forEach(function(item, i){
      var node = children[i]

      if(!node){
        node = stamper.cloneNode(true);
      }

      var model = {};
      model.$parent = cmpAttr;
      model.$data = item;
      model.$index = i;
      sea.applyBindings(model, node);

      if(!node.parentNode) {
        el.appendChild(node);
      }

      // TODO: destroy previous computed?
    })

  }
}

