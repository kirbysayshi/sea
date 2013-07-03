var dom = require('../domutil')
  , databind = require('../index.databind')

exports.controlsChildren = true;

exports._models = {};
exports.modelFor = function(el, parent, data, index, rootModel){
  var id = dom.idFor(el);
  var model = exports._models[id] || {};

  // model hasn't changed, return it
  if(!exports.elModelWillChange(el, parent, data, index)){
    return model;
  }

  // model has changed, update properties...
  model.$parent = parent;
  model.$data = data;
  model.$index = index;
  model.$root = rootModel;

  // ... and cache it for later
  exports._models[id] = model;

  return model;
}

exports.elModelWillChange = function(el, parent, data, index, rootModel){
  var id = dom.idFor(el);
  var model = exports._models[id];

  return !(
    model
    && model.$parent === parent
    && model.$data === data
    && model.$index === index
    && model.$root === rootModel
  )
}

exports.init = function(){}
exports.update = function(el, cmpAttr, rootModel, currentModel){
  var items = cmpAttr()
    // very important that this come before call to children
    // .templateFor removes the children if there is no cached template,
    // meaning only two outcomes: there is a template, or there are existing
    // rendered child nodes
    , stamper = databind.templateFor(el)

  // memoize and allow for lazy creation/eval
  var _childNodes = null;
  function childNodes(){
    if(!_childNodes){
      _childNodes = dom.onlyElementNodes(dom.slice(el.childNodes))
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
      nodes = dom.slice(node.childNodes);
    } else {
      // it's just a normal node
      nodes = [node]
    }

    // "Templates" can contain multiple nodes without a container.
    // each node will be assigned a unique id, and different model instances
    // with the same data
    nodes.forEach(function(node){
      willChange = exports.elModelWillChange(node, currentModel, item, i, rootModel);

      if(willChange){
        // cache/update the model, and apply child bindings
        var model = exports.modelFor(node, currentModel, item, i, rootModel);
        databind.applyBindings(model, node);
      }

      fragment().appendChild(node);
    })
  });

  // batch operation
  if(fragment().childNodes.length){
    el.appendChild(fragment());
  }
}