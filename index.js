
var sea = module.exports = {
  _observables: {},
  _called: null,
  _debug: false
};

sea.slice = function(thing){ return Array.prototype.slice.call(thing) }

sea.guid = (function(){
  var guid = 0;
  return function(type){
    return 'sea' + (type ? '_' + type + '_' : '_') + (++guid);
  }
}());

sea.markAsCalled = function(id){
  return sea._called && (sea._called[id] = true);
}

var observable = sea.observable = function(val, opts){
  var id = (opts && opts.id) || sea.guid('obs');

  var self = sea._observables[id] = {

    id: id,

    _val: val,

    _dependents: [],

    accessor: function(newVal){
      sea.markAsCalled(id);

      if(typeof newVal !== 'undefined' && self.peek() !== newVal){
        sea._debug && console.log(id, 'changed from', self.peek(), newVal);
        self._val = newVal;
        self.notifyDependents();
      }

      return self._val;
    },

    notifyDependents: function(){
      self._dependents.forEach(function(dId){
        sea._observables[dId].evaluate();
      })
    },

    evaluate: function(){
      var prevRCalled = sea._called;
      var oldVal = self._val;
      sea._called = {};
      self._val = self.accessor();

      sea._debug && console.log('accessor changed from', oldVal, 'to', self._val);

      if(oldVal !== self._val) {
        self.notifyDependents();
      }

      //if(oldVal !== self._val) {
        var calledKeys = Object.keys(sea._called);
        calledKeys.forEach(function(id){
          var obs = sea._observables[id];
          obs && sea._observables[id].addDependent(self.id);
        });
      //}

      sea._called = prevRCalled || null;
      return calledKeys;
    },

    destroy: function(){
      self.evaluate().forEach(function(id){
        var obs = sea._observables[id];
        obs && sea._observables[id].removeDependent(self.id);
      });
    },

    peek: function(){
      return self._val
    },

    addDependent: function(id){
      if(this._dependents.indexOf(id) <= -1){
        return this._dependents.push(id);
      }
    },

    removeDependent: function(id){
      var idx = this._dependents.indexOf(id);
      if(idx > -1){
        this._dependents.splice(idx, 1);
      }
    }
  };

  if(opts && opts.accessor){
    self.accessor = opts.accessor;
  }

  /*self.accessor.throttle = function(min){
    var last = Date.now();
    return function(newVal){
      var now = Date.now()
        , ret;
      if(now - last > min){
        last = now;
        return self.accessor(newVal);
      }

      return self.peek();
    }
  }*/

  // allow access to instance
  self.accessor.self = self;
  self.accessor.valueOf = self.peek;

  return self.accessor;
}

sea.computed = function(factory){
  var obs = observable(undefined, { accessor: factory, id: sea.guid('cmp') });
  obs.self.evaluate();
  return obs.self.accessor;
}

sea.observableArray = function(val){
  var obs = observable(val || [], { id: sea.guid('arr') });
  var slice = Array.prototype.slice;
  var self = obs.self;

  var mutators = ['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'];

  mutators.forEach(function(m){
    obs[m] = function(){
      var args = slice.call(arguments);
      var result = Array.prototype[m].apply(self._val, args);
      sea.markAsCalled(self.id);
      self.notifyDependents();
      return result;
    }
  });

  var accessors = [
    // iterators
    'forEach', 'every', 'some', 'filter', 'map', 'reduce', 'reduceRight',
    // accessors
    'concat', 'indexOf', 'join', 'lastIndexOf', 'slice'
  ];

  accessors.forEach(function(m){
    obs[m] = function(){
      var args = slice.call(arguments);
      var result = Array.prototype[m].apply(self._val, args);
      sea.markAsCalled(self.id);
      return result;
    }
  });

  return obs;
}
