# NAME TBD - GESTURES FOR THE WEB

## WHY?

Pull-to-refresh, swipe to open a button bar, long press;
all these are a core UX of mobile apps. And they are
not built into the web platform.

I love to have library of common mobile gestures,
especially for those small projects where adding a 1000 lines
of event handling code feels like an overkill. This is poker
app, not an event handler!

I was hoping someone already wrote what I wanted, but did not
find anything that met all my requirements. `hammer.js` was close, 
but the event-base API meant there was still a fair amount of code
that I'd have to write.

Bonus: I've always wondered how to make gestures play nice with
accessibility.

## DESIGN OBJECTIVES

1. Support for common gestures, and their effects.
  * SwipeHorizontal, with SwipeHorizontalButtonMenuEffect
  * SwipeVertical, with PullToRefreshEffect
  * Drag, with DragDropEffect
  * Rotate
  * Pinch
  * Press, LongPress
  * Tap, DoubleTap

2. Support for registering multiple gestures on the same element

    If SwipeLeft & SwipeRight gestures are registered on the same element, only one should activate, depending on the way user is swiping.

3. Extensibility; it should be super easy to implement a new effect, and easy to implement a new gesture.

    Common gesture tasks should be part of the library, so that every gesture author does not have to look up how to prevent text selection.

4. Accessibility; gestures should be accessible. No idea how to do this yet, but if Apple Mail/Maps are accessible, we should be too.

5. No memory leaks. Developers should not have to remove a gesture to prevent memory leaks.

6. Simple API that mirrors EventListener api. 

## USAGE

```html
<div id="swipeDown" style="height:200px">swipe down to reveal a spinner</div>
```
```javascript
// Register pullToRefresh gesture on an element
// Pull to referesh reveals a spinner on top of an element when
// swiped down.
// 
// Swiping down is a *gesture* handled by is SwipeVertical GestureHandler
// Displaying of a spinner is an *effect* handled by PullToRefereshEffect GestureEffect
//
// Registration of gestures is handled by GestureManager

import GestureManager from "../src/gestureManager.js";
import SwipeVertical from "../src/gestures/swipeVertical.js";
import PullToRefreshEffect from "../src/effects/pullToRefreshEffect.js";

let el = document.querySelector("#swipeDown");
let effect = new PullToRefreshEffect({container: el});
let gesture = new SwipeVertical(el, {effect: effect});

GestureManager.addGesture(gesture);

```

## ARCHITECTURE

