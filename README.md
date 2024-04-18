# js-gestures
gesture recognition library
## TODO
- GestureManager
  - handling gestures nested inside DOM (stopPropagation, but for DOM?)
- GestureHandler
- GestureEffect
  - effects cleanup (removal from DOM)
    - internal to effect: when button is pressed, need to reference effect for cleanup
    - external
      - another gesture starts
      - click on body
- SwipeLeft
- SwipeLeftMenuEffect
  - cleaning uo feedback items?
    - cleanup of gesture feedback artifact
      - feedback always has a method called "clear" that cleans up all artifacts.
    - not strictly part of gesture handling
  
  - animation 
  - icons with [font awesome](https://docs.fontawesome.com/web/setup/packages/)
- start wrinting basic documentation for gesture users, gesture authors

- make some nice looking gestures!
  https://developer.apple.com/design/human-interface-guidelines/gestures#Standard-gestures
- test framework
  - qunit: hammer.js uses it. Need a test runner for qunit that does Chrome/FF/Safari
  - https://bestofjs.org/projects?tags=test&sort=monthly-downloads
- investigate stop gesture propagation

## Documentation
### Gesture authors
  EventSpecs:
    it is common to listen to events on document.body.
    eventSpec supports this as a shortcut where:
      eventSpec.element: 'body' will automatically substitute document.body for body.
        
    eventSpec{ eventType: *, element: 'body'} is treated as:
## Design

- gestures are registered like event listeners
- multiple gestures can be recognized at the same time
- users can add new gesture types
- a11y: gestures should be accessible
  - Something like this, but for the web: https://developer.android.com/guide/topics/ui/accessibility/principles#accessibility-actions
  - a11y front end developer, maybe talk to her
    https://www.ellyloel.com/blog/front-end-development-s-identity-crisis/

- library is a module
- tests
- bundlers should strip out unused gestures (rollup, webpack)

- Technical considerations
  - memory should not be leaked if users do not unregister gesture
  - handle element being deleted mid-gesture
    - will no longer receive events
  - disabling text selection: 

## Tests needed:
 - textSelectionEnabled

### Initial API
Gesture library
- there are two APIs.
  1. User: registers/unregisters prebuilt gestures. Also iterate existing handlers?
    - will need a way to respond to gesture (visual feedback, abort)
  2. Gesture developer
    - gesture developer never calls addEventListener to handle events on their own.
      if they did, the library could not coordinate multiple simultaneous gestures 

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

## Related work
[Svelte gestures](https://github.com/Rezi/svelte-gestures)
  Serious implementation. Covers most of the usual gestures. I am having a hard time navigating TS/Svelte code. Gestures are dispatched as events. I am curious how they do memory management. Not using pointercapture. 

## DONE
Apr-18 swipe callback options
Apr-18 implemented default mode for swipe
Apr-17 refactored out buttonMenu, swipeLeftButtomMenuEffect
Apr-16 making progress in separating out button menus, effects
Apr-16 styles needed will be dynamically added by every component with appendStyleRule
Apr-12 preventScrollOnMove gestureHandler option
Apr-11 gestureEffect initial API
Apr-9 SwipeLeft: animateMenuToWidth
Apr-3 SwipeLeft: add clear method for feedbacks
Apr-3 SwipeLeft: animate all movement, animate message body too
Apr-3 SwipeLeft: show over 50%, hide under 50%
Mar-30 SwipeLeft animations
Mar-30 SwipeLeft listen on body
Mar-30 GestureManager: disable text selection (user-select on body)
Mar-22 Callbacks should be flat part of options
Mar-22 gesture-logger custom element for testing
Mar-22 1st gesture implementation: swipeLeft
Mar-22 Initial gesture API
         use jsdoc to document public API and interesting types
Mar-19 Implemented partial callbacks
Mar-?? https://bestofjs.org/projects?tags=test&sort=monthly-downloads