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

sea.Observable = function(opts){
	this.id = sea.guid(opts.idType || 'obs');
	this.val = opts.value;

	this._dependents = [];
	this.accessor = opts.accessor || this.accessor;
}

sea.Observable.prototype.peek = function(){
	return this.val;
}

sea.Observable.prototype.accessor = function(newVal){
	sea.markAsCalled(this.id);

	if(typeof newVal !== 'undefined'){
		this.val = newVal;
		this.notifyDependents();
	}

	return this.val;
}

sea.Observable.prototype.addDependent = function(id){
	if(this._dependents.indexOf(id) <= -1){
		return this._dependents.push(id);
	}
}

sea.Observable.prototype.notifyDependents = function(){
	this._dependents.forEach(function(id){
		sea._observables[id].evaluate();
	})
}

sea.Observable.prototype.evaluate = function(){
	var self = this;

	var prevRCalled = sea._called;
	sea._called = {};

	this.val = this.accessor();

	Object.keys(sea._called).forEach(function(id){
		var obs = sea._observables[id];
		obs && sea._observables[id].addDependent(self.id);
	})

	sea._called = prevRCalled || null;
}

sea.ObservableArray = function(opts){
	sea.Observable.call(this, opts);
}

sea.ObservableArray.prototype = Object.create(sea.Observable.prototype);
sea.ObservableArray.constructor = sea.ObservableArray;

sea.ObservableArray.prototype.push =
sea.ObservableArray.prototype.forEach = function(m){
	var args = Array.prototype.slice.call(arguments);
	args.shift(); // remove m
	var origLength = this.val.length;
	sea.markAsCalled(this.id);
	var ret = Array.prototype[m].apply(this.val, args);
	if(this.val.length !== origLength){
		this.notifyDependents();
	}
	return ret;
}

sea.observable = function(val){
	var obs = new sea.Observable({ value: val });
	sea._observables[obs.id] = obs;
	return obs.accessor.bind(obs);
}

sea.computed = function(fac){
	var obs = new sea.Observable({ idType: 'cmp', accessor: fac });
	sea._observables[obs.id] = obs;
	obs.evaluate();
	return obs.peek.bind(obs);
}

sea.observableArray = function(val){
	var obs = new sea.ObservableArray({ idType: 'arr', value: val || [] });
	sea._observables[obs.id] = obs;
	var ret = obs.accessor.bind(obs);
	['push', 'forEach'].forEach(function(m){
		ret[m] = sea.ObservableArray.prototype[m].bind(obs, m);
	})
	return ret;
}

