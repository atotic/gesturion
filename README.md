# gesturion
gesture recognition library
## TODO

1. GestureManager.getIdle gestures on an element
2. Make sure single pointer gestures are only handling single pointer
3. Demo pages - initially on github, also put them on codepen?
https://blog.codepen.io/documentation/embedded-pens/

4. How to package the library? Minified single file would be good?
Demo framework
  index page 
  view transitions would be cool
    https://developer.chrome.com/docs/web-platform/view-transitions/cross-document
    https://github.com/bramus/view-transitions-demos/blob/main/src/stack-navigator/mpa/scripts.js
    https://github.com/WICG/view-transitions/blob/main/explainer.md
    https://drafts.csswg.org/css-view-transitions/

List app: a list with button menus, drag, popout on long press
1. Swipe left menu 
2. Swipe right menu

Pinch/rotate
Inline handlers

4. Documentation
5. Accessibility

## TODO later
- Should activation of a gesture cause all other gestures on same element
to become idle?
Drag
  bounds constraints
Tap, 
DoubleTap
Rotate - add desktop support with option+cursor


Contact Red Blob games about what I've done. He might be interested
in using it.
https://www.redblobgames.com/blog/2024-04-17-draggable-examples/
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
https://alice.pages.igalia.com/blog/how-shadow-dom-and-accessibility-are-in-conflict/
https://www.smashingmagazine.com/2021/03/complete-guide-accessible-front-end-components/#accessible-comics
- library is a module
- tests
- bundlers should strip out unused gestures (rollup, webpack)

- Technical considerations
  - memory should not be leaked if users do not unregister gesture
  - handle element being deleted mid-gesture
    - will no longer receive events
  - disabling text selection: 

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
## IDEAS
Naming:
js-gestures describes it, but a bit too generic.
able-gestures (has a11y angle in the name)
gesturability - too clever?
gesturion

Also, if ever doing a video, introduce some fun hand gestures: middle finger, etc 

Interesting CSS properties:
[-webkit-touch-callout](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-touch-callout)
[-webkit-user-drag](https://caniuse.com/webkit-user-drag)
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

4) deal with drag with multiple pointers: only 1 pointer id gets tracked

Why not just use hammer.js:
- not a fan of the API, demos. I am a fan of gesture composability

## References
https://www.smashingmagazine.com/2021/03/complete-guide-accessible-front-end-components/#accessible-comics

https://shoelace.style/ cool library of web components, about to
become Web Awesome

[Svelte gestures](https://github.com/Rezi/svelte-gestures)
  Serious implementation. Covers most of the usual gestures. I am having a hard time navigating TS/Svelte code. Gestures are dispatched as events. I am curious how they do memory management. Not using pointercapture. 

https://m3.material.io/foundations/interaction/gestures

- make some nice looking gestures!
  https://developer.apple.com/design/human-interface-guidelines/gestures#Standard-gestures
- https://bestofjs.org/projects?tags=test&sort=monthly-downloads

Multiple gestures are not so [easy in Swift either](https://steipete.com/posts/supporting-both-tap-and-longpress-on-button-in-swiftui/)

dmose: contact https:///javascriptweekly.com/ or tldr.tech newsletterxxz

## DONE
```
Jun-25 Initial cut of list demo complete
Jun-24 View Transitions no longer work. Seems to be related to module loading. Building up a test case at ~/vtBug
Jun-22 Added timeout activate to drag. Discovered svh units that fix scrolling issue
Jun-21 Pull-to-refresh, button menus work
Jun-20 Starting demo pages, view transitions work
Jun-6 Inline effect handlers can define simple object effects.
Jun-4 Figure out how to trace selenium, and figured out why tests were flakey. Run automatically button was being clicked before ready.
Jun-4 Inline event handlers implemented as GestureManager.OnEvent
May-28 Memory usage test passes!
May-28 Liveness check for active gestures
May-27 Initial set of gestures is complete
May-27 implemented PressGesture with HightlightEffect. GestureManager got requestStateChange
May-24 horizontal test flakiness might come from scrollIntoView animations.
May-24 Dnd move vs copy. Added 
May-21 Drag'n'drop sample implementation
May-18 Initial freeform drag implementation
May-18 Converted all gesture add'l arguments to extras
May-17 Starter drag gesture implementation
May-16 Pinch completed on desktop via wheel event
May-16 Pinch+zoom completed on touch
May-15 Implemented Rotate gesture+effect for touch (trackpad does not work?)
May-14 SwipeVertical gets waitForScrollBoundary
May-13 Allow GestureEffect to set default Gesture options gestureOptionOverrides()
May-13 Started aborting animations, and found new edge cases
May-12 Initial pullToRefresh done. Still needs scroll integration
May-12 Long investigation of vertical swipes on mobile in test/investigation/preventScroll.html
May-2 Started SwipeVertical
May-1 Collapse for testFramework so I can see tests on iOS
May-1 Multiple gestures on same element are now exclusive
Apr-30 EffectCleaner is now configurable. It gests initialized in gestureEffect constructor.
Apr-30 SwipeLeft/Right unify to SwipeHorizontal
Apr-30 test.description can be used as name
Apr-30 testSwipeLtr fully featured
Apr-26 npm run test will run Selenium, and display results
Apr-26 Add window.onerror to testFramework to catch uncaught errors
Apr-26 GestureEffect.ANIM_TIME
Apr-26 SwipeLeft tests done. 6 mighty tests for button menu!
Apr-24 Created small testFramework that can be run by Selenium
Apr-23 EffectCleaner cleans on pointerdown. To make it work,
       gestureManager has to do "stopPropagation"
Apr-22 globalEffectClear: still needs to handle null clicks
Apr-22 Add speed to swipes, reveal/hide by quick swipe.
Apr-19 Prevent scrolling only if gesture is active
Apr-19 Dismiss menu on click in content area
Apr-19 Removed partials
Apr-19 Add instantActiveOnWait to resume gesture
Apr-19 Multi-message swipe test
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
```
