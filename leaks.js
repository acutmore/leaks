;(function(rx) {

if (rx === undefined || rx.Observable === undefined) {
  throw new Error('Leak$ - No Rx');
}

var log = console.log.bind(console);
var getProto = Object.getPrototypeOf.bind(Object);
var defProp = Object.defineProperty.bind(Object);
var hasOwn = Object.prototype.hasOwnProperty;

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
  var NULL = {};
  return ({
    get: function(o) {
      var v = o[KEY];
      return v === NULL ? undefined : v;
    },
    set: function(o, v) {
      defProp(o, KEY, { configurable: true, writable: true, value: v });
    },
    has: function(o) {
      return hasOwn.call(o, KEY) && o[KEY] !== NULL;
    },
    delete: function(o) {
      defProp(o, KEY, { configurable: true, writable: true, value: NULL });
    }
  });
})();

var o = rx.Observable.just(1);
var po = getProto(o);
var ppo = getProto(po);
var pppo = getProto(ppo);

var subscriptions = 0;
var printSubscriptions = throttle(function() {
  log('subscriptions', subscriptions);
}, 1000);
var up = function() { subscriptions += 1; printSubscriptions(); };
var down = function() { subscriptions -= 1; printSubscriptions(); };

var originalSubscribe = pppo.subscribe;
var insideSubscribe = false; // Handle recursive code inside RxJs
var insideSubscribe_true = function() {
  insideSubscribe = true;
  return function() {
    insideSubscribe = false;
  };
};

var wrapObservable = function(observable) {
  return rx.Observable.create(function (observer) {
    up();
    var disposable = originalSubscribe.call(observable, observer);
    return function() {
      down();
      disposable.dispose();
    };
  });
};

pppo.subscribe = function() {
  var ob = this;
  var newOb = weakMap.get(ob);
  if (!newOb) {
    newOb = wrapObservable(ob);
    weakMap.set(newOb, newOb);
    weakMap.set(ob, newOb);
  }
  return originalSubscribe.apply(newOb, arguments);
};

})(Rx);
