var assert = require('assert')
  , sea = require('../index')

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
    assert.equal(o('no'), 'no')
    assert.equal(c(), 'no')
  }

  ,'.destroy prevents further recomputes': function(){
    var called = 0
    var o = sea.observable('a')
    var c = sea.computed(function(){
      o();
      called += 1;
    })

    assert.equal(o.self._dependents[0], c.self.id, 'observable has computed in dependents array');

    assert.equal(called, 1, 'called one time to evaluate')
    o('b')
    assert.equal(called, 2, 'called once again after obs update')

    c.self.destroy();
    o('c')
    assert.equal(called, 3, 'called once to determine dependencies, then not again')

    assert.notEqual(o.self._dependents[0], c.self.id, 'observable no longer has computed in dependents array');
  }
}

exports.observableArray = {

  'with no args defaults to empty array': function(){
    var a = sea.observableArray();
    assert.equal(a().length, 0);
  }

  ,'sets default values given initial array': function(){
    var a = sea.observableArray(['a']);
    assert.equal(a().length, 1);
    assert.equal(a()[0], 'a');
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

  ,'a new array replaces': function(){
    var arr1 = ['a']
      , arr2 = ['b']
      , a = sea.observableArray(arr1);

    assert.strictEqual(a(), arr1);
    a(arr2);
    assert.strictEqual(a(), arr2);
  }
}
