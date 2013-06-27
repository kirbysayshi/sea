var assert = require('assert')
  , sinon = require('sinon')
  , sea = require('../dom')

// skip running if not in a browser
if(typeof window === 'undefined') return;

var scratch = document.querySelector('#scratch');
var $  = function(query, ctx){
  return [].slice.call((ctx || scratch).querySelectorAll(query));
}

exports['Data Binding'] = {

  '': ''

  ,'destroyBindings': {

    before: function(){
      //sea.destroyBindings(scratch);
      var html = ''
        + '<p data-text="same()"></p>'
        + '<ul data-foreach="items()">'
        + '  <li data-text="$data"></li>'
        + '</ul>';
      scratch.innerHTML = html
    }

    ,'ceases updates after': function(){
      var items = sea.observableArray(['a'])
        , same = sea.observable('a');
      sea.applyBindings({ items: items, same: same }, scratch);

      sea.destroyBindings(scratch);
      items.push('b');
      same('b')

      var lis = $('ul li')
        , p = $('p');
      assert.equal(lis.length, 1, 'no new dom elements');
      assert.equal(p[0].textContent, 'a', 'paragraph has not been updated');
    }
  }

  ,'data-text': {

    before: function(){
      var html = '<p data-text="t()"></p>';
      scratch.innerHTML = html
    }

    ,'observable updates value': function(){

      var t = sea.observable('Hello!');
      sea.applyBindings({ t: t }, scratch);
      var p = $('p')[0];

      assert.equal(p.textContent, 'Hello!');

      t('Goodbye!');
      assert.equal(p.textContent, 'Goodbye!');
    }
  }

  ,'data-foreach': {

    beforeEach: function(){
      //sea.destroyBindings(scratch);
      var html = ''
        + '<ul data-foreach="items()">'
        + '  <li data-text="$data"></li>'
        + '</ul>';
      scratch.innerHTML = html
    }

    ,'renders intially': function(){
      var items = sea.observableArray(['a', 'b', 'c']);
      sea.applyBindings({ items: items }, scratch);

      var lis = $('ul li');
      assert.equal(lis.length, 3);
      lis.forEach(function(li, i){
        assert.equal(li.textContent, items()[i]);
      })
    }

    ,'.push appends a new li': function(){
      var items = sea.observableArray(['d', 'e', 'f']);
      sea.applyBindings({ items: items }, scratch);
      items.push('g');

      var lis = $('ul li');
      lis.forEach(function(li, i){
        assert.equal(li.textContent, items()[i]);
      })

      assert.equal(lis.length, 4, 'there should be 4 list items');
    }

    ,'replacing array keeps DOM elements': function(){
      var items = sea.observableArray(['a', 'b', 'c']);
      sea.applyBindings({ items: items }, scratch);

      var lis = $('ul li');
      assert.equal(lis.length, 3);
      items(['d', 'e', 'f']);
      var newlis = $('ul li');

      newlis.forEach(function(li, i){
        assert.equal(li.textContent, items()[i]);
        assert.strictEqual(newlis[i], lis[i]);
      })
    }

    ,'modelFor': {

      'retrieves same object for same data': function(){
        var el = document.createElement('div')
          , parent = { name: 'parent' }
          , data = { name: 'data' }
          , index = 2;

        var modelA = sea.bindings.foreach.modelFor(el, parent, data, index)
          , modelB = sea.bindings.foreach.modelFor(el, parent, data, index)

        assert.strictEqual(modelA, modelB, 'same arguments returns same model');
      }
    }

    ,'nested observables': {

      beforeEach: function(){
        var html = ''
          + '<ul data-foreach="items()">'
          + '  <li data-text="$data()"></li>'
          + '</ul>';
        scratch.innerHTML = html
      }

      ,'are rendered': function(){
        var items = sea.observableArray([
            sinon.spy(sea.observable('a'))
          , sinon.spy(sea.observable('b'))
          , sinon.spy(sea.observable('c'))
        ]);
        sea.applyBindings({ items: items }, scratch);

        var lis = $('ul li');
        assert.equal(lis.length, 3);

        items().forEach(function(item){
          assert.equal(item.calledTwice, true, 'observable is accessed twice, once for text binding, once for creation of bound computed for element');
        })

        lis.forEach(function(li, i){
          assert.equal(li.textContent, items()[i]());
        })
      }

      /*,'are not rerendered with a push': function(){

        function calledTwice(item, i){
          assert.equal(item.calledTwice, true, 'observable is only accessed twice: ' + item.callCount);
        }

        var items = sea.observableArray([
            sinon.spy(sea.observable('a'))
          , sinon.spy(sea.observable('b'))
          , sinon.spy(sea.observable('c'))
        ]);

        sea.applyBindings({ items: items }, scratch);
        items().forEach(calledTwice)

        items.push(sinon.spy(sea.observable('d')));
        items().forEach(calledTwice)

        items.push(sinon.spy(sea.observable('e')));
        items().forEach(calledTwice)
      }*/
    }

  }

}
