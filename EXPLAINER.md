# GESTURABILITY - GESTURES FOR THE WEB

## WHY?

Pull-to-refresh, swipe to open a button bar, long press;
all these are a core UX of mobile apps. And they are
not built into the web platform.

I'd find a library of common mobile gestures very useful,
especially for those small projects where adding a 1000 lines
of event handling code feels like an overkill. This is poker
app, not an event handler!

I was hoping someone already wrote what I wanted, but did not
find anything that met all my requirements. `hammer.js` was close, 
but the event-base API did not click for me.

And, I've always wondered how to make gestures play nice with
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

    If SwipeLeft & SwipeRight gestures are registered on the same element, only one should activate.

3. Extensibility; it should be super easy to implement a new effect, and easy to implement a new gesture.

    Common gesture task should be part of the library, so that every gesture author does not have to look up how to prevent text selection.

4. Accessibility; gestures should be accessible. No idea how to do this yet, but if Apple Mail/Maps are accessible, we should be too.

5. No memory leaks. Developers should not have to remove a gesture to prevent memory leaks.

6. Simple API that mirrors EventListener api. 

## ARCHITECTURE

## USAGE


###
