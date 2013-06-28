var assert = require('assert')
  , sinon = require('sinon')
  , sea = require('../dom')

// skip running if not in a browser
if(typeof window === 'undefined') return;

var scratch = document.querySelector('#scratch');
var $  = function(query, ctx){
  return [].slice.call((ctx || scratch).querySelectorAll(query));
}

function calledTwice(item, i){
  assert.equal(item.calledTwice, true, 'observable is only accessed twice: ' + item.callCount);
}

exports['Data Binding'] = {

  '': ''

  ,'idFor': {

    'returns the same id for a div': function(){
      var el = document.createElement('div')
        , id = sea.dom.idFor(el);

      assert.equal(sea.dom.idFor(el), id);
    }

    ,'returns the same id for a document fragment': function(){
      var el = document.createDocumentFragment()
        , id = sea.dom.idFor(el);

      assert.equal(sea.dom.idFor(el), id);
    }
  }

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

  ,'data-css': {

    'depends on observable': {

      before: function(){
        var html = '<p class="css-class-name-1" data-css="{ \'css-class-name-1\': !a(), \'css-class-name-2\': a() }"></p>';
        scratch.innerHTML = html;
      }

      ,'and toggles': function(){
        var a = sea.observable(true);
        sea.applyBindings({ a: a }, scratch);

        var p = sea.dom.select('p', scratch)[0];
        assert.equal(p.classList.contains('css-class-name-2'), true)
        assert.equal(p.classList.contains('css-class-name-1'), false)

        a(false);
        assert.equal(a(), false, 'a should be false');
        console.log(p);
        assert.equal(p.classList.contains('css-class-name-2'), false)
        assert.equal(p.classList.contains('css-class-name-1'), true)
      }
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

    ,'.push multiple items updates once': function(){
      var items = sea.observableArray(['d', 'e', 'f']);
      var origUpdate = sea.bindings.foreach.update;
      var updateSpy = sea.bindings.foreach.update = sinon.spy(sea.bindings.foreach.update);
      sea.applyBindings({ items: items }, scratch);

      assert.equal(updateSpy.calledOnce, true, 'update method should be called once during applyBindings')

      items.push('g', 'h', 'i', 'j');

      assert.equal(updateSpy.calledTwice, true, 'update method should be called once more after push')

      var lis = $('ul li');
      lis.forEach(function(li, i){
        assert.equal(li.textContent, items()[i]);
      })

      assert.equal(lis.length, 7, 'there should be 7 list items');
      sea.bindings.foreach.update = origUpdate;
    }

    ,'.sort rerenders': function(){
      var items = sea.observableArray(['z', '1', 'x', 'y']);
      sea.applyBindings({ items: items }, scratch);

      items.sort();

      var lis = $('ul li')
        , sorted = ['1', 'x', 'y', 'z'];
      lis.forEach(function(li, i){
        assert.equal(li.textContent, sorted[i]);
      })
    }

    ,'modelFor': {

      'creates object with properties': function(){
        var el = document.createElement('div')
          , parent = { name: 'parent' }
          , data = { name: 'data' }
          , index = 2;

        var modelA = sea.bindings.foreach.modelFor(el, parent, data, index)

        assert.strictEqual(modelA.$parent, parent, '$parent is present');
        assert.strictEqual(modelA.$data, data, '$data is present');
        assert.strictEqual(modelA.$index, index, '$index is present');
      }

      ,'retrieves same object for same data': function(){
        var el = document.createElement('div')
          , parent = { name: 'parent' }
          , data = { name: 'data' }
          , index = 2;

        var modelA = sea.bindings.foreach.modelFor(el, parent, data, index)
          , modelB = sea.bindings.foreach.modelFor(el, parent, data, index)

        assert.strictEqual(modelA, modelB, 'same arguments returns same model');
      }

      ,'retrieves same object for same element': function(){
        var el = document.createElement('div')
          , parent = { name: 'parent' }
          , data = { name: 'data' }
          , index = 2;

        var modelA = sea.bindings.foreach.modelFor(el, parent, data, index);
        var modelB = sea.bindings.foreach.modelFor(el, parent, data, 3);
        assert.strictEqual(modelA, modelB, 'same element returns same model');
        assert.equal(modelA.$index, 3, 'index has been updated');
      }
    }

    ,'elModelWillChange': {

      'returns true if model does not exist': function(){
        var el = document.createElement('div')
          , parent = { name: 'parent' }
          , data = { name: 'data' }
          , index = 2;

        assert.equal(sea.bindings.foreach.elModelWillChange(el, parent, data, index), true);
      }

      ,'returns true if model will change': function(){
        var el = document.createElement('div')
          , parent = { name: 'parent' }
          , data = { name: 'data' }
          , index = 2;

        var modelA = sea.bindings.foreach.modelFor(el, parent, data, index);
        index = 3;

        assert.equal(sea.bindings.foreach.elModelWillChange(el, parent, data, index), true);
      }

      ,'returns false if model will not change': function(){
        var el = document.createElement('div')
          , parent = { name: 'parent' }
          , data = { name: 'data' }
          , index = 2;

        var modelA = sea.bindings.foreach.modelFor(el, parent, data, index);
        assert.equal(sea.bindings.foreach.elModelWillChange(el, parent, data, index), false);
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

        // observable is accessed twice, once for text binding, once for creation of bound computed for element
        items().forEach(calledTwice)

        lis.forEach(function(li, i){
          assert.equal(li.textContent, items()[i]());
        })
      }

      ,'are not rerendered with a push': function(){

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
      }

      ,'are rerendered if order changes': function(){

        var items = sea.observableArray([
            sinon.spy(sea.observable('a'))
          , sinon.spy(sea.observable('b'))
          , sinon.spy(sea.observable('c'))
        ]);

        sea.applyBindings({ items: items }, scratch);
        items().forEach(calledTwice)

        var d = sinon.spy(sea.observable('d'))
          , a = items()[0];

        items()[0] = d;
        items.self.notifyDependents(); // manually signal a change
        assert.equal(d.calledOnce, true, 'd is only evaluated for the text binding since the element computed already exists');
        // the originals will not have been rerendered
        items().slice(1).forEach(calledTwice);
        // ensure that no silliness is going on
        calledTwice(a);
      }
    }

    ,'nested bindings': {

      beforeEach: function(){
        var html = ''
          + '<ul data-foreach="items()">'
          + '  <li data-css="{ \'css-class-name-1\': $data() }" data-text="$data()"></li>'
          + '</ul>';
        scratch.innerHTML = html
      }

      ,'data-css': function(){
        var items = sea.observableArray([
            sea.observable('a')
          , sea.observable('b')
        ]);

        sea.applyBindings({ items: items }, scratch);
        var lis = sea.dom.select('li', scratch);
        assert.equal(lis[0].classList.contains('css-class-name-1'), true);
        assert.equal(lis[1].classList.contains('css-class-name-1'), true);

        items()[0](false);

        assert.equal(lis[0].classList.contains('css-class-name-1'), false);
        assert.equal(lis[1].classList.contains('css-class-name-1'), true);
      }
    }

  }

}
