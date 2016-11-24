;(function(rx){

if (rx === undefined || rx.Observable === undefined) {
  throw new Error('Leak$ - No Rx');
}

function log(v) { console.log(v); };

function getProto(o) {
  if (Object.getPrototypeOf) {
     return Object.getPrototypeOf(o);
  }
  return o.__proto__;
}

var o = rx.Observable.just(1);
var po = getProto(o);
var ppo = getProto(po);
var pppo = getProto(ppo);

var subscriptions = 0;
var up = function() { subscriptions += 1; };
var down = function() { subscriptions -= 1; };

var lastPrinted;

setInterval(() => {
  if (lastPrinted !== subscriptions){
    lastPrinted = subscriptions;
    log('subscriptions ' + subscriptions);
  }
}, 3000);

var originalSubscribe = pppo.subscribe;
var alreadyCounted = false; // Handle recursive code inside RxJs

pppo.subscribe = function() {
  try {
    var ob = this;
    var reset = false;
    if (!alreadyCounted) {
      up();
      alreadyCounted = true;
      reset = true;
      ob = ob.do(undefined, down, down);
    }
    return originalSubscribe.apply(ob, arguments);
  }
  finally {
    if (reset) {
      alreadyCounted = false;
    }
  }
}

})(Rx);
