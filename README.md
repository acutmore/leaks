# Leak$
## RxJs 4 Subscription Leak Detection Tool

### Install

```html
<html>
  ...
  <script src="rx.all.js"></script>
  <script src="leaks.js"></script>
  ...
</html>
```

### Use

##### Logging
While running Leak$ will continuiously print the current number of subscriptions to the console.

If this number tends to grow more than shrink then there is almost certaintly a subscription leak.

##### Getting information on source of possible leaks
1. `window.leaks.trace = true`
2. Do user interaction (get your observers to subscribe to their sources)
3. `window.leaks.trace = false`
4. Do user interaction to get back to previous state (unsubscribe the observers)
5. `window.leaks.stacks` now contains stack traces of observers that didn't unsubscribe
6. `window.leaks.pushError()` will send a LeakError to observers that didn't unsubscribe
