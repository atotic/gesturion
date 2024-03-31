
let debug = 1;
function warn(...args) {
  if (debug)
    console.warn(...args);
}
function log(...args) {
  if (debug)
    console.log(...args);
}


/**
 GestureManager - main gesture handling API

  Web Developer Usage:
  - add/remove gestures from DOM.
  - coordinates event processing between GestureHandlers
  
  */
const GMSym = Symbol("GestureManagerSymbol");

class GestureManager {
  /* Implementation notes:

GestureManager cannot keep references to gestures/elements on itself because
a reference would keep them alive in memory even after Element has been removed
from DOM, causing memory leaks.

What GestureManaager does:
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
  HandlerTypes = new Map(); // "gestureName" => GestureHandler

  ActiveHandlers = []; // currently active GestureHandler

  static GestureStates = ['idle', 'waiting', 'active'].freeze;

  constructor() {
    this.boundHandleGHEvent = this.handleGHEvent.bind(this);
  }
  /**
   * Register a gesture. Registered gestures can be used to addGesture() by gesture name.
   * @arg {GestureHandler} handler - handler class definition
   */
  registerGestureHandler(handler) {
    if (!handler)
      throw `registerHandler called without a handler`;
    let name = handler.name();
    if (!name)
      throw `GestureHandler did not provide a name`;
    if (this.HandlerTypes.has(name))
      console.warn("Duplicate registration of GestureHandler ", name);
    this.HandlerTypes.set(name, handler);
  }

  addGesture(el, gesture, gestureOptions) {
    if ((typeof gesture) == 'string') {
      let handler = this.HandlerTypes.get(gesture);
      if (handler === undefined) 
        throw `Unrecognized gesture type "${gesture}". Did you forget to register it?`;
      gesture = new handler(gestureOptions);
    }
    this.#setGestureState(gesture, 'idle');
    return gesture;
  }

  removeGesture(gesture) {
    this.#removeAllEventSpecs(gesture);
  }

  #canonicalEventSpec(eventSpec, gesture) {
    if ((typeof eventSpec) == 'string')
      eventSpec = { eventType: eventSpec, element: gesture.element()};
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
      handlerList = [];
      allGestureHandlers.set(eventSpec.eventType, handlerList);
      // First handler, start listening for events
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
        eventSpec.element.removeEventListener(eventSpec.eventType, this.boundHandleGHEvent);
      }
    }
  }
  #removeAllEventSpecs(gesture) {
    for (let eventSpec of gesture.allEventSpecs())
      this.#removeGestureListener(eventSpec, gesture);
  }
  #setGestureState(gesture, newState) {
    // remove all old state listeners
    let oldState = gesture.getState();
    if (oldState == newState) {
      warn("setGestureState called, but gesture was in newState already");
    }
    if (oldState) {
      for (let spec of gesture.eventSpecs(oldState))
        this.#removeGestureListener(spec, gesture);
    }
    gesture.setState(newState);
    for (let spec of gesture.eventSpecs(newState)) {
      this.#addGestureListener(spec, gesture);
    }
    this.#setTextSelection(newState == 'active' ? 
        gesture.textSelectionEnabled() : true);
  }

  // Utility routine to prevent text selection
  #setTextSelection(enabled) {
    // TODO
    // Bug: if we stop tracking a gesture in active state,
    //   selection might be stuck being disabled, bad UX.
    // Fix: heartbeat that reenables selection if no active gestures
    //   need testcase for this.
    console.log("setTextSelection", enabled);
    if (enabled) {
      document.body.classList.remove('ableGestureSelectNone');
    } else {
      document.body.classList.add('ableGestureSelectNone');
    }
  }

  // handles events intented for gesture handlers
  handleGHEvent(event) {
    let allGestureHandlers = event.currentTarget[GMSym];
    if (!allGestureHandlers) {
      warn("No GestureHanders of any type for ", ev.currentTarget, ev);
      return;
    }
    let eventGestureHandlers = allGestureHandlers.get(event.type);
    if (!eventGestureHandlers) {
      warn("No GestureHanders of type ", ev.type, " for ", ev.currentTarget, ev);
      return;
    }
    let newStateRequests = [];
    for (let gh of eventGestureHandlers) {
      let newState = gh.handleEvent(event);
      // Process new states later. Doing it now is not safe because
      // it can modify eventGestureHandlers array.
      if (newState)
        newStateRequests.push({gesture: gh, state:newState});
    }
    for (let r of newStateRequests)
      this.#setGestureState(r.gesture, r.state);
  }
  // TODO: special case for active state handling: conflict resolution, etc.
}

export default new GestureManager();

// Import our styles into main document
{
  let style = document.createElement("style");
  style.setAttribute("id", "able-gesture-gestureManager.js");
  style.innerText = `
    .ableGestureSelectNone {
      user-select: none;
    }
  `;
  document.querySelector("head").prepend(style);  
}

// export default const singleton = new GestureManagerClass();
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