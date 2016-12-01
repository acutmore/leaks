;(function(global, rx) {

if (rx === undefined || rx.Observable === undefined) {
  throw new Error('Leak$ - No Rx');
}

// Helpers

function throttle(callback, time) {
  var timer;
  var pending = false;
  var timeout = function() {
    timer = null;
    pending && callback();
    pending = false;
  };

  return function() {
    if (timer == null) {
      callback();
      timer = setTimeout(timeout, time);
    } else {
      pending = true;
    }
  };
}

var weakMap = (function() {
  var KEY = '09871283ubajskndbjvh';
  return ({
    get: function (o) {
      return o[KEY];
    },
    set: function (o, v) {
      Object.defineProperty(o, KEY, { configurable: true, writable: true, value: v });
    },
    has: function (o) {
      return Object.prototype.hasOwnProperty.call(o, KEY);
    },
    delete: function (o) {
      delete o[KEY];
    }
  });
})();

var getStackTrace = function() {
  try {
    throw new Error();
  } catch (e) {
    return e.stack.split('\n').filter(function(s) { return !/\/rx\./.test(s) && !/leaks\.js/.test(s); }).join('>>');
  }
};

// Logic
var errorSubject = new rx.Subject();

var Leaks = global.leaks = {
  pushError: function() { errorSubject.onNext(new Error('Leak$ error triggered')); },
  trace: false,
  stacks: {},
  subscriptions: new Rx.BehaviorSubject(0)
};

var addStack = function() {
  var stack = getStackTrace();
  if (stack == null || stack == "") {
    return undefined;
  }
  var existingCounter = Leaks.stacks[stack];
  if (!existingCounter) {
    existingCounter = { counter: 0 };
    Leaks.stacks[stack] = existingCounter;
  }
  existingCounter.counter++;

  return function removeStack() {
    if (--(existingCounter.counter) === 0) {
      var currentCounter = Leaks.stacks[stack];
      if (currentCounter === existingCounter) {
        delete Leaks.stacks[stack];
      }
    }
  };
};

var logNewSubscription = function() { Leaks.subscriptions.onNext(Leaks.subscriptions.getValue() + 1); };
var logSubscriptionDisposed = function() { Leaks.subscriptions.onNext(Leaks.subscriptions.getValue() - 1); };
Leaks.subscriptions.subscribe(throttle(function() {
  console.log('subscriptions', Leaks.subscriptions.getValue());
}, 1500));

var originalSubscribe = rx.Observable.prototype.subscribe;
rx.Observable.prototype.subscribe = function() {
  function wrapObservable(observable) {
    return rx.Observable.create(function(observer) {
      logNewSubscription();
      var removeStack;
      var disposable = new rx.CompositeDisposable();
      if (Leaks.trace) {
        removeStack = addStack();
        disposable.add(originalSubscribe.call(errorSubject, function(e) { observer.onError(e); }));
      }
      disposable.add(originalSubscribe.call(observable, observer));
      return function() {
        logSubscriptionDisposed();
        removeStack && removeStack();
        disposable.dispose();
      };
    });
  };

  var ob = this;
  var newOb = weakMap.get(ob);
  if (!newOb) {
    newOb = wrapObservable(ob);
    weakMap.set(newOb, newOb);
    weakMap.set(ob, newOb);
  }
  return originalSubscribe.apply(newOb, arguments);
};

})(typeof global === 'object' ? global : this, typeof global === 'object' ? global.Rx : this.Rx);
