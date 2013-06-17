var sea = {
  _observables: {},
  _computeds: {},
  _called: null
};

sea.guid = (function(){
  var guid = 0;
  return function(type){
    return 'sea' + (type ? '_' + type + '_' : '_') + (++guid);
  }
}());

sea.markAsCalled = function(id){
  return sea._called && (sea._called[id] = true);
}

sea.observable = function(val){
  var id = sea.guid('obs');

  var self = sea._observables[id] = {
    id: id,
    val: val,
    accessor: function(newVal){
      //sea._called && (sea._called[id] = true);
      sea.markAsCalled(id);
      if(typeof newVal !== 'undefined'){
        self.val = newVal;
        self._dependents.forEach(function(id){
          sea._computeds[id].evaluate();
        })
      }

      return self.val;
    },
    peek: function(){ return self.val },
    _dependents: [],
    addDependent: function(id){
      if(this._dependents.indexOf(id) <= -1){
        return this._dependents.push(id);
      }
    }
  };

  return self.accessor;
}

sea.computed = function(fac){
  var id = sea.guid('cmp');

  var self = sea._computeds[id] = {
    id: id,
    fac: fac,
    val: null,
    evaluate: function(){
      var prevRCalled = sea._called;
      sea._called = {};
      self.val = fac();
      Object.keys(sea._called).forEach(function(id){
        var obs = sea._observables[id];
        obs && sea._observables[id].addDependent(self.id);
      })
      sea._called = prevRCalled || null;
    },
    peek: function(){ return self.val }
  }

  self.evaluate();

  return self.peek;
}

sea.observableArray = function(val){

  var id = sea.guid('obs');

  var self = sea._observables[id] = {
    id: id,
    val: val || [],
    accessor: function(newVal){
      //sea._called && (sea._called[id] = true);
      sea.markAsCalled(id);
      if(typeof newVal !== 'undefined'){
        self.val = newVal;
        self._dependents.forEach(function(id){
          sea._computeds[id].evaluate();
        })
      }

      return self.val;
    },
    peek: function(){ return self.val },
    _dependents: [],
    addDependent: function(id){
      if(this._dependents.indexOf(id) <= -1){
        return this._dependents.push(id);
      }
    }
  };

  ['push', 'forEach'].forEach(function(m){
    var slice = Array.prototype.slice;
    self.accessor[m] = function(){
      var args = slice.call(arguments);
      var origLength = self.val.length;
      sea.markAsCalled(id);
      var ret = Array.prototype[m].apply(self.val, args);
      if(self.val.length !== origLength){
        self._dependents.forEach(function(id){
          sea._computeds[id].evaluate();
        })
      }
      return ret;
    }
  })

  return self.accessor;
}
