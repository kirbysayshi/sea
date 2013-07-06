var sea = require('./index.js');

exports.slice = function(nodeList){ return Array.prototype.slice.call(nodeList) }

exports.select = function(selector, context){
  context = context || document;
  return exports.slice(context.querySelectorAll(selector));
}

exports.onlyElementNodes = function(list){
  return list.filter(function(node){
    return node.nodeType === 1;
  })
}

// return false to not add childnodes
exports.breadthChildren = function(el, cb){
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

// retrieves or sets and retrieves a uid for a dom element (not element.id)
exports.idFor = function(el){
  var prefix = 'nde';
  if(el.dataset){
    return el.dataset.seaid || (el.dataset.seaid = sea.guid(prefix))
  } else {
    return el.seaid || (el.seaid = sea.guid(prefix))
  }
}


var evman = exports.evman = {
  handlers: [],
  on: function(el, event, handler){
    evman.handlers.push({ el: el, event: event, handler: handler });
    el.addEventListener(event, handler, false);
  },
  off: function(opt_el, opt_event, opt_handler){
    evman.handlers = evman.handlers.filter(function(binding, i){
      if(
        (el === binding.el || !opt_el)
        && (binding.event === opt_event || !opt_event)
        && (binding.handler === opt_handler || !opt_handler)
      ){
        binding.el.removeEventListener(binding.event, binding.handler, false);
        return false;
      }
      return true;
    });
  }
}


