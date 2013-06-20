var assert = require('assert')

  , sea = require('../index.mini')

exports.observable = {

  'defaults to undefined': function(){
    var o = sea.observable();
    assert.equal(o(), undefined);
  }

  ,'updates value': function(){
    var o = sea.observable(null);
    assert.equal(o(), null);
    assert.equal(o(2), 2);
  }

}

exports.computed = {

  'defaults to undefined': function(){
    var o = sea.computed();
    assert.equal(o(), undefined);
  }

  ,'returns a static value': function(){
    var c = sea.computed(function(){
      return 'a';
    })

    assert.equal(c(), 'a');
  }

  ,'depends on observable': function(){
    var o = sea.observable(null)
      , c = sea.computed(function(){
        return o();
      })

    assert.equal(o.self._dependents[0], c.self.id, 'observable has computed in dependents array');

    assert.equal(o(), null)
    assert.equal(c(), null)
    assert.equal(o('yes'), 'yes')
    assert.equal(c(), 'yes')
  }
}

exports.observableArray = {

  'with no args defaults to empty array': function(){
    var a = sea.observableArray();
    assert.equal(a().length, 0);
  }

  ,'.push updates a computed': function(){
    var a = sea.observableArray()
      , c = sea.computed(function(){
        return a().join(',')
      });

    assert.equal(c(), '');
    a.push('1');
    assert.equal(c(), '1');
    a.push('2', '3');
    assert.equal(c(), '1,2,3');
  }
}