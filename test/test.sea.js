var assert = require('assert')
  , sinon = require('sinon')
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
  '': ''

  ,'defaults to undefined': function(){
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
    var o = sinon.spy(sea.observable(null))
      , c = sea.computed(function(){
        return o();
      })

    assert.equal(o.calledOnce, true, 'dependent observable is only accessed once')
    assert.equal(o.self._dependents[0], c.self.id, 'observable has computed in dependents array');

    assert.equal(o(), null)
    assert.equal(c(), null)
    assert.equal(o('yes'), 'yes')
    assert.equal(o.callCount, 4, 'observable accessor should be called twice more, once to set, once via computed: '+o.callCount)
    assert.equal(c(), 'yes')
    assert.equal(o('no'), 'no')
    assert.equal(c(), 'no')
  }

  ,'depends on computed': function(){
    var o = sinon.spy(sea.observable(null))
      , c1 = sea.computed(function(){
        return o();
      })
      , c2 = sea.computed(function(){
        return c1();
      })

    o('yes');
    assert.equal(c2(), 'yes', 'c2 should be yes: ' + c2());
  }

  ,'.destroy prevents further recomputes': function(){
    var called = 0
    var o = sinon.spy(sea.observable('a'))
    var accessor = sinon.spy(function(){
      o();
    })
    var c = sea.computed(accessor)

    assert.equal(o.self._dependents[0], c.self.id, 'observable has computed in dependents array');

    assert.equal(accessor.calledOnce, true, 'called one time to evaluate')
    o('b')
    assert.equal(accessor.calledTwice, true, 'called once again after obs update')

    c.self.destroy();
    o('c')

    assert.equal(accessor.calledThrice, true, 'called once to determine dependencies, then not again')
    assert.equal(o.callCount, 5, 'observable was accessed 5 times')
    assert.notEqual(o.self._dependents[0], c.self.id, 'observable no longer has computed in dependents array');

    c();
    assert.equal(o.callCount, 5, 'observable was still only accessed 5 times: '+o.callCount)
  }

  ,'cyclic dependencies': {

    'observable depends on computed that modifies observable': function(){
      var o = sea.observable('a')
        , c = sea.computed(function(){
          return o(o() + 'a');
        })

      assert.equal(o(), 'aa');
      assert.equal(c(), 'aa');
    }

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
