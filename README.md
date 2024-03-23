# js-gestures
gesture recognition library

## Design

- gestures are registered like event listeners
- multiple gestures can be recognized at the same time
- users can add new gesture types
- a11y: gestures should be accessible
  - Something like this, but for the web: https://developer.android.com/guide/topics/ui/accessibility/principles#accessibility-actions

- library is a module
- tests
- bundlers should strip out unused gestures (rollup, webpack)

- Technical considerations
  - memory should not be leaked if users do not unregister gesture
  - disabling text selection: 

## TODO

- Prevent text dragging during swipeLeft. 
- make some nice looking gestures!
  https://developer.apple.com/design/human-interface-guidelines/gestures#Standard-gestures
- test framework
  - qunit: hammer.js uses it. Need a test runner for qunit that does Chrome/FF/Safari
  - https://bestofjs.org/projects?tags=test&sort=monthly-downloads
- investigate stop gesture propagation

### Initial API
Gesture library
- there are two APIs.
  1. User: registers/unregisters prebuilt gestures. Also iterate existing handlers?
    - will need a way to respond to gesture (visual feedback, abort)
  2. Gesture developer
    - gesture developer never calls addEventListener to handle events on their own.
      if they did, the library could not coordinate multiple simultaneous gestures 

$8qHxSK2OMfhdOsmI0R&

What does gesture library do?
1. Translates events to gestures. 
pointerdown
pointerup
pointermove
pointerenter
pointerleave
pointercancel
pointerover

2. Utilities
  - prevent context menu during gesture
      `contextmenu event preventDefault()`
  - prevent scrolling during gesture
      `touchmove event preventDefault()`

#### User API
1. add/remove gestures, mirrors `addEventListener` API
  - addGesture(element, gestureName || gestureHandler, gestureHandlerOptions)
  - removeGesture(element, gestureName || gestureHandler)
    - remove all by name, or by gestureHandler
2. getGestures(element), gets all gesture handlers for a specific element
3. to handle gesture actions, user can create custom gestureHandlers or pass callbacks to gestureHandlerOptions

#### Developer API
1. Developer should never add gesture event listeners directly, use GestureManager for that.

#### GestureManager design
- GestureManager has monopoly on add/removeEventListener. It manages all the raw gesture-related events.

#### GestureHandler design
- Each GestureHandler can be in multiple states:
  1. idle: initial state. No events have been processed at all. Arrival of any "waiting" event puts handler in waiting state. There are no callbacks in the idle state. 
  2. waiting: In waiting state, handler "watches" events, and determining if it should become active. Events gets callbacks
  3. Active: Handler processes active events.
  4. Completed: Handler is completed. Can provide visual feedback, once complete goes back to idle.
  5. Cancelled: Handler is cancelled, Can provide visual feedback, once complete goes back to idle.

Following state transitions are legal:
  - idle -> waiting
  - waiting -> active
  - waiting -> completed
  - waiting -> cancelled
  - active -> completed
  - active -> cancelled
  - completed -> idle
  - cancelled -> idle

Each state has a set of events are observed while in that state.
GestureHandler gets event callbacks for all observed events from GestureManager.
Inside the callback handler can:
- provide visual feedback to the user
- tell GestureManager that it would like to change state through callback return value  
  GestureHandler must not change its state on its own, it can only be changed by GestureManager call 
  Should GestureHandler even know its state?
  Sometimes, GestureHandler changes state not in response to an observed event, but some other event not handled by GestureManager. How do we handle that?

Sometimes, GestureHandler needs to respond to events not processed by GestureManager

GestureHandler API:
{
  constructor(options);
  stateChanged(newState);
  // @returns null, or newState if desired.
  handleEvent(event);
}
## Renaming library
- js-gestures describes it, but a bit too generic.
- i'd like to introduce a11y into the name. able-gestures? 
Ideas:
1. able-gestures (has a11y angle in the name)

## Code structure:
modules vs plain javascript? 
## Brainstorming

Initial idea: Accessibility as [Gesture Toolbox](https://docs.google.com/document/d/1-ptDjG1yDTsGYcRsG-raieqpq8seACmtMMUb5gFLisQ/edit#heading=h.g739nyt99zt6) 

### Why? 

Touch gesture handling is more complex than desktop gesture handling.
An example is an editable list:
- swipe up/down scrolls
- long press initiates a list item move
- swipe left/right opens up a button menu on left/right
Implementing these correctly can be a challenge. 
- same event can trigger multiple gestures
- some aspects of event handling are non-obvious (async vs sync, which preventDefault stops long-press popup from appearing)
- no way to combine gestures, specify which ones have priority
- no a11y on gestures
- hard to automate tests
- debugging is a PITA

Could I write a gesture primitives library that I can use to implement:
- drag'n'drop
- editable list
  - up/down scroll (default behavior)
  - long press item move
  - swipe left/right button menu

Common gestures:
tap pinch rotation swipe pan screenEdgePan longPress hover dragNdrop
doubleTap

What would these gesture primitives look like?
What should it do?

What does drag'n'drop look like:

dnd states:

Drag source
1) initial:
pointerdown on drag source: 
  enters 
  sets starting location
2) awaitDrag
  waits for starting location to significantly change. Once it does, enters
  startDrag
3) startDrag

Why not just use hammer.js:
- not a fan of the API, demos. I am a fan of gesture composability


## DONE
Mar-22 Callbacks should be flat part of options
Mar-22 gesture-logger custom element for testing
Mar-22 1st gesture implementation: swipeLeft
Mar-22 Initial gesture API
         use jsdoc to document public API and interesting types
Mar-19 Implemented partial callbacks
Mar-?? https://bestofjs.org/projects?tags=test&sort=monthly-downloads