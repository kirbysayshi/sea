
Sea: From computed to shining computed
======================================

This is an experiment to see what the minimum for a functioning [knockoutjs][] is, as well as a test bed for experimenting with data-binding and data dependencies. `sea` references the word "see", as in "look at data and see it change automatically" (yes, it's it a stretch).

This whole thing is around 3K gzipped!

This is an experiment, and should probably not be used. Feel free to try and make it better though.

[knockoutjs]: http://knockoutjs.com/

Running Tests
-------------

I wrote a blog post about running tests for this framework in the [browser and nodejs][] for more details.

To build:

    npm test

[browser and nodejs]: http://kirbysayshi.com/2013/07/01/mocha-tests-node-and-browser.html

Using
-----

In the browser (run `npm test` to build `sea.browser.js` in the root):

    <script type="text/javascript" src="sea.browser.js"></script>

In node:

    var sea = require('sea')

Examples:
---------

See [examples/todo/index.html][] for a fully functioning TodoMVC-esque example.

### Computed property depends on observable

    var firstName = sea.observable('Johnny');
    var fullName = sea.computed(function(){
      return firstName() + ' Tatlock';
    })

    console.log(firstName()) // 'Johnny'
    console.log(fullName()) // 'Johnny Tatlock'

    firstName('James')

### `foreach` data binding (depends on a DOM)

    <ul data-foreach="items()">
      <li data-text="$data"></li>
    </ul>

    var items = sea.observableArray(['d', 'e', 'f']);
    sea.applyBindings({ items: items }); // renders
    items.push('g'); // adds a new list item

Current Bindings
----------------

- data-text: sets the element's `textContent` to the passed value
  - `data-text="someObservable()"`
- data-css: applies the css class if the passed value is truthy
  - `data-css="{ 'css-class-name-1': someObservable() }"`
- data-if: conditionally processes children if the passed value is truthy
  - `data-if="someObservable()"`
- data-value: two-way binds an observable to a text input on keyup
  - `data-value="someObservable"`
- data-foreach: efficiently creates and updates nodes based on the passed array-like object
  - `data-foreach="someObservable()"`
  - Also supports `$parent`, `$root`, `$data`, and `$index` for each interation
- data-checked: keeps a checkbox input in two-way sync with an observable
  - `data-checked="someObservable"` (notice how it's not called, just referenced)
- data-_DOMEventName_: shortcuts for common event handlers, and it's _very_ easy to add more (see [index.databind.js][])
  - `data-click="handler"`
  - `data-dblclick="handler"`
  - `data-keydown="handler"`
  - `data-keyup="handler"`

On Cyclic Dependencies
----------------------

Don't do that. :)

LICENSE
-------

Copyright (c) 2013 Andrew Petersen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.