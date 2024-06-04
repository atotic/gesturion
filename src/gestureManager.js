/**
 GestureManager - main gesture handling API

Usage, Web Developer:

1) add/remove gestures to DOM elements with addGesture/removeGesture

```javascript
import gestureManager from "../gestureManager.js";
import RotateGesture from "../src/gestures/rotate.js";
import RotateEffect from "../src/effects/rotateEffect.js";

let element = document.querySelector("YOUR GESTURE TARGET SELECTOR");
let effect = new RotateEffect(element);
let gesture = new RotateGesture(element, {effect: effect});
gestureManager.addGesture(gesture);
// .....
// You do not have to remove gestures on element deletion, there will
// be no memory leaks.
gestureManager.removeGesture(gesture);
```

Usage, Gesture Developer:


Usage, Other:
  - broadcasts 'gestureActivated' event when new gesture becomes active
    CustomEvent(detail: gesture | [gesture])

*/

import appendStyleRule from "./gestureStyles.js";

// Element[GMSym] has a Map<eventType, [GestureHandler]> 
// It's a map of GestureHandlers for event types.
const GMSym = Symbol("GestureManagerSymbol");

let SelectNoneCSSClass = "ableGestureSelectNone";

class GestureManager extends EventTarget {
  /* Implementation notes:

GestureManager cannot keep references to gestures/elements on itself because
a reference would keep them alive in memory even after Element has been removed
from DOM, causing memory leaks.

What GestureManager does:
1. keeps track of mapping between gesture names and classes, 
  so you can use addGesture with a name.
2. event coordination - coordinates events between multiple gesture handlers
  - listens to events
  - dispatches events to gesture handlers
  - if mulitple gesture handlers want to become active, decides which one has priority
    TODO: priority handling is still not fully thought out. Lets see how it works in 
    practice.
3. Utilities:
  - can prevent scrolling
  - can prevent right-click menu

Implementation:
- when GestureHandler is added, it goes into an idle state, and its idle listeners are installed
- add GestureHandler listeners:
  - remove all other gesture listeners
  - add it to that list.
    if the list was empty, addEventListener for that event
- removing GestureHandler listeners
  - Remove handler from Element.GMSym 
    if the list is empty, removeEventListener
- Where are GestureHandlers stored on the Element? 
  - for each event type, need a list of handlers dealing with it.
    - Element.GMSym is a Map<'eventname' => [GestureHandlers]>
- processing events: the interesting part:
  dispatch events to gesture handlers for processing.
  what can GH do with an event wrt to GestureManager:
    - tell GM that it'd like to switch state
    - GM decides which state switches are allowed
      - tells allowed handlers to change state
      - active state is special:
        - you can only have 1 active state per element (by default, could have them cooperate?)
        - can you have multipe active states per document? 
      
- not doing drag'n'drop. Can do drag, drop does not really fit:
  - drop gestures are only active once drag starts.
*/
  #boundLivenessCheck;

  HandlerTypes = new Map(); // "gestureName" => GestureHandler

  #activeGestures = []; // currently active GestureHandler

  static GestureStates = ['idle', 'waiting', 'active'].freeze;

  ACTIVE_GESTURE_EVENT = 'gestureActivated';

  constructor() {
    super();
    this.boundHandleGHEvent = this.handleGHEvent.bind(this);
  }

  /**
   * Register a gesture. Registered gestures can be used to addNamedGesture()
   * @arg {GestureHandler} handler - handler class definition
   */
  registerGestureHandler(handler) {
    if (!handler)
      throw `registerHandler called without a handler`;
    let name = handler.name;
    if (!name)
      throw `GestureHandler did not provide a name`;
    if (this.HandlerTypes.has(name))
      console.warn("Duplicate registration of GestureHandler ", name);
    this.HandlerTypes.set(name, handler);
  }

  /**
   * 
   * @param {GestureHandler} gesture 
   */
  addGesture(gesture) {
    if ((typeof gesture) == 'string') {
      let handler = this.HandlerTypes.get(gesture);
      if (handler === undefined) 
        throw `Unrecognized gesture type "${gesture}". Did you forget to register it?`;
      gesture = new handler(el, gestureOptions);
    }
    this.#setGestureState(gesture, 'idle');
  }

  removeGesture(gesture) {
    if (!gesture)
      return;
    this.#removeFromActive(gesture);
    this.#removeAllEventSpecs(gesture);
    gesture.options.effect.clear();
  }

  /**
   * @returns {Array<GestureHandler>}
   */
  activeGestures() {
    return this.#activeGestures;
  }

  /**
   * @returns boolean -- true if state did change
   */
  requestStateChange(gesture, state, othersGoIdle) {
    if (state == 'active') {
      if (this.#activeGestures.length != 0)
        return false;
      // On activation, other gestures on same element go to idle
      this.#forceOtherGesturesToIdle(gesture);
      this.#setGestureState(gesture, state);
      return true;
    }
    // idle/waiting requests are processed immediately
    this.#setGestureState(gesture, state);
    return true;
  }

  #forceOtherGesturesToIdle(gesture) {
    let handlerMap = gesture.element()[GMSym];
    if (handlerMap) {
      for (let [eventType, handlers] of gesture.element()[GMSym]) {
        for (let handler of handlers)
          if (handler != gesture && handler.getState() != 'idle') {
            this.#setGestureState(handler, 'idle');
            console.log(`Forcing gesture to idle`);
          }
      }
    }
  }

  // Active gestures whose elements have been removed from DOM
  // must be deactivated
  livenessCheck() {
    let removeFromActive = [];
    for (let gesture of this.#activeGestures) {
      let isLive = true;
      // TODO, determine whether element is 
      let el = gesture.element();
      if (el && el.offsetWidth == 0) { // Removed element size is 0
        if (!el.parentNode || el.getClientRects().length == 0) {
          // TODO: unsure what the correct "node is in DOM" check is
          // Could walk the tree, but not sure how to traverse ShadowDOM boundaries
          isLive = false;
        }
      }
      if (!isLive)
        removeFromActive.push(gesture);
    }
    for (let gesture of removeFromActive) {
      console.log("liveness removal ", gesture.name());
      this.#setGestureState(gesture, 'idle');
    }
    this.#scheduleLivenessCheck();
  }

  #scheduleLivenessCheck() {
    if (!this.#boundLivenessCheck)
      this.#boundLivenessCheck = this.livenessCheck.bind(this);
    if (this.#activeGestures.length > 0)
      window.setTimeout(this.#boundLivenessCheck, 500);
  }

  #addToActive(gesture) {
    let activeIdx = this.#activeGestures.indexOf(gesture);
    if (activeIdx != -1) {
      console.warn("#addToActive on already active gesture");
      return;
    }
    this.#activeGestures.push(gesture);
    this.#updateTextSelectionPrevention();
    this.#updateScrollPrevention();
    this.dispatchEvent(new CustomEvent(this.ACTIVE_GESTURE_EVENT, {
      detail: this.#activeGestures
    } ));
    this.#scheduleLivenessCheck();
  }

  #removeFromActive(gesture) {
    let activeIdx = this.#activeGestures.indexOf(gesture);
    if (activeIdx != -1) {
      this.#activeGestures.splice(activeIdx, 1);
      this.#updateTextSelectionPrevention();
      this.#updateScrollPrevention();
    }
  }

  #canonicalEventSpec(eventSpec, gesture) {
    if ((typeof eventSpec) == 'string')
      eventSpec = { eventType: eventSpec, element: gesture.element()};

    // Resolve the element if needed
    let resolvedElement;
    if ((typeof eventSpec.element) === 'string')
      resolvedElement = document.body;
    else if (!eventSpec.element)
      resolvedElement = gesture.element();

    if (resolvedElement)  // Clone because original is const
      eventSpec = {eventType: eventSpec.eventType, element: resolvedElement};

    if (!eventSpec.eventType || !eventSpec.element)
      throw "Bad eventSpec " + eventSpec.eventType + " " + eventSpec.element;

    return eventSpec;
  }
  /**
   * @typedef {Map<String, Array<GestureHandler>} ElementGestureHandlers - maps event names to GestureHandlers
   * Map is stored on the Element as Element[GMSym] 
   */

  /**
   *
   * @param {EventSpec} eventSpec - what event to listen to on what element
   * @param {GestureHandler} gesture - gesture handler processing the event?
   */
  #addGestureListener(eventSpec, gesture) {
    eventSpec = this.#canonicalEventSpec(eventSpec, gesture);
    let allGestureHandlers = eventSpec.element[GMSym];
    if (!allGestureHandlers) {
      allGestureHandlers = new Map();
      eventSpec.element[GMSym] = allGestureHandlers;
    }
    let handlerList;
    if (allGestureHandlers.has(eventSpec.eventType)) {
      handlerList = allGestureHandlers.get(eventSpec.eventType);
    } else {
      // First handler, start listening for events
      handlerList = [];
      // console.log("installing ", eventSpec.eventType);
      allGestureHandlers.set(eventSpec.eventType, handlerList);
      eventSpec.element.addEventListener(eventSpec.eventType, this.boundHandleGHEvent);
    }
    handlerList.push(gesture);
  }

  // Undo #addGestureListener
  #removeGestureListener(eventSpec, gesture) {
    eventSpec = this.#canonicalEventSpec(eventSpec, gesture);
    let allGestureHandlers = eventSpec.element[GMSym];
    if (!allGestureHandlers)
      return;
    if (allGestureHandlers.has(eventSpec.eventType)) {
      let handlerList = allGestureHandlers.get(eventSpec.eventType);
      let i = handlerList.indexOf(gesture);
      handlerList.splice(i,1);
      if (handlerList.length == 0) {
        // No more gestures listening.
        allGestureHandlers.delete(eventSpec.eventType);
        // console.log("removing ", eventSpec.eventType);
        eventSpec.element.removeEventListener(eventSpec.eventType, this.boundHandleGHEvent);
      }
    }
  }

  #removeAllEventSpecs(gesture) {
    for (let eventSpec of gesture.allEventSpecs())
      this.#removeGestureListener(eventSpec, gesture);
  }

  // Set gesture state, and setup gesture's event listeners
  // @param {boolean} forceInlineHandler - force install of idle inline handler
  #setGestureState(gesture, newState, event=null, forceInlineHandler=false) {
    // remove all old state listeners
    let oldState = gesture.getState();
    if (oldState == newState) {
      console.warn("setGestureState called, but gesture was in newState already");
      return;
    }
    if (oldState) {
      for (let spec of gesture.eventSpecs(oldState))
        this.#removeGestureListener(spec, gesture);
    }
    try {
      gesture.setState(newState, event);
    } catch(err) {
      console.error("GestureHandler.setState threw an exception", gesture.name(), err);
    }
    // Gesture handlers are 
    let discardInlineHandler = gesture.options.inlineHandler && newState == "idle";
    if (discardInlineHandler && !forceInlineHandler) {
      // inlineHandlers are discarded when they go to back to idle
      // console.log("Discarding idle inline handler");
      this.#removeAllEventSpecs(gesture);
    } else {
      // In
      for (let spec of gesture.eventSpecs(newState)) {
        this.#addGestureListener(spec, gesture);
      }
    }
    if (oldState == 'active')
      this.#removeFromActive(gesture);
    if (newState == 'active')
      this.#addToActive(gesture);
  }

  // Gestures often prevent text selection during gesture
  // Implemented by setting user-select:none on <BODY>
  #updateTextSelectionPrevention() {
    // console.log("preventTextSelection", prevent);
    let prevent = false;
    for (let g of this.#activeGestures) {
      prevent ||= g.preventTextSelection();
    }
    // console.log("updateTextSelectionPrevention", prevent);
    if (prevent) 
      document.body.classList.add(SelectNoneCSSClass);
    else
      document.body.classList.remove(SelectNoneCSSClass);
  }

  #updateScrollPrevention() {
    let prevent = false;
    let gestureElements = [];
    for (let g of this.#activeGestures) {
      if (g.preventDefaultScroll()) {
        prevent = true;
        gestureElements.push(g.element());
      }
    }
    // console.log("updateScrollPrevention", prevent);
    if (prevent) {
      if (this.preventScrollingListener)
        return;
      // console.log("scroll prevented");
      // Unsure where to add the listener that prevents scrolling?
      // document.body prevents body scroll, catches all events
      // gesture.element() prevents all scrolling, but might not catch body events.
      // lets do both!
      this.preventScrollingListener = {
        elements: [document.body, ...gestureElements], 
        callback: ev => {
          // console.log("preventing touchMove", ev.currentTarget);
          // stopPropagation() breaks gestures that depend on touchmove
          ev.preventDefault();
        }
      };
      for (let el of this.preventScrollingListener.elements) {
        el.addEventListener('touchmove', this.preventScrollingListener.callback,  
        { passive: false });
      }
    } else {
      if (!this.preventScrollingListener)
        return;
      // console.log("scroll activated");
      for (let el of this.preventScrollingListener.elements)
        el.removeEventListener('touchmove', this.preventScrollingListener.callback);
      delete this.preventScrollingListener;
    }
  }

  // handles events intented for gesture handlers
  handleGHEvent(event) {
    let allGestureHandlers = event.currentTarget[GMSym];
    if (!allGestureHandlers) {
      console.warn("No GestureHanders of any type for ", event.currentTarget, event);
      return;
    }
    let eventGestureHandlers = allGestureHandlers.get(event.type);
    if (!eventGestureHandlers) {
      console.warn("No GestureHanders of type ", event.type, " for ", event.currentTarget, event);
      return;
    }
    let stateRequests = [];
    let activeRequests = [];
    for (let gesture of eventGestureHandlers) {
      try {
          // console.log(event.type);
        let newState = gesture.handleEvent(event);
        // Active gestures stop propagation of their events.
        // EffectCleaner depends on this
        if (gesture.getState() == 'active' || newState == 'active') {
          // console.log("stopPropagation", event.type);
          event.stopPropagation();
        }
        // Process new states later. Doing it now is not safe because
        // it can modify eventGestureHandlers array.
        if (newState) {
          if (newState == 'active')
            activeRequests.push(gesture);
          else
            stateRequests.push({gesture: gesture, state:newState});
        }
      } catch(err) {
        console.error("Uncaught exception inside a gesture event handler", err, event, gesture);
      }
    }
    // Activation algorithm:
    // There can be only 1 active gesture at a time 
    // TODO This might expand to a group of related gestures in the future.
    // Requests to activate if another gesture is already active will
    // be rejected.

    // Process non-active state requests first,
    // because active gesture might become inactive)
    for (let r of stateRequests)
      this.#setGestureState(r.gesture, r.state, event);
    // Discard active requests that cannot be fullfilled
    let deletedActiveRequests = [];
    if (this.#activeGestures.length > 0) {
      deletedActiveRequests = activeRequests.splice(0);
    }
    if (activeRequests.length > 1)
      deletedActiveRequests.push(...activeRequests.splice(1));
    for (let g of deletedActiveRequests) {
      // Should unfullfilled active requests go to idle? 
      // Makes sense for swipeHorizontal, others?
      this.#setGestureState(g, 'idle', event);
      // console.log("Gesture not activated ", g.name());
    }
    for (let g of activeRequests)
      this.#setGestureState(g, 'active', event);
  }

  // TODO, experimental, enable registration of gestures in onevent handlers
  // Usage:
  // <div onpointerdown="GestureHandler.On.bind({gesture: 'RotateGesture', effect: 'RotateEffect'})">
  // Ugly, but might be useful
  OnEvent(ev, gestureProto, effectProto, gestureOptions, effectOptions) {
    // this contains our options because of bind
    let target = ev.currentTarget;
    gestureOptions ||= {};
    gestureOptions.effect = new effectProto(effectOptions);
    gestureOptions.inlineHandler = true;
    let gesture = new gestureProto(ev.currentTarget, gestureOptions);
    try {
      singleton.#setGestureState(gesture, 'idle', null, true);
      singleton.handleGHEvent(ev);
    } catch(err) {
      console.error("Unexpected error handing instant registration event", err);
    }
  }
}

let singleton = new GestureManager();

export default singleton;

// style for preventTextSelection
appendStyleRule(`.${SelectNoneCSSClass}`, "{user-select: none;-webkit-user-select:none}");

/*
Implementation:
1. memory leaks: ignore for now, implementation is complex as is!
- how to prevent memory leaks.
- if GestureManager holds onto an Element, it'll leak
- GestureHandlers can be:
  - held on by GestureManager
    - cons: GestureManager would have to remove listeners
  - held on at elements

2. EventListener management
- each element/event combo has a single listener.
  that listener dispatches events to all GestureHandlers listening for that event
- when to remove event listener?
  when gesturehandlers are no longer listening

*/
