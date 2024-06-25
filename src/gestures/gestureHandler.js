/**
 * GestureHandler
 * 
 * GestureManager expects all gestures to implement GestureHandler API.
 * Subclass this class if you are defining your own gesture.
 */
import GestureEffect from "../effects/gestureEffect.js";

export default class GestureHandler {
  // Used by tests to test default speed
  // If your gesture reports speed, use this value for speed if set.
  // Why: speed is computed from timestamps, 
  // which cannot be set on synthetic events
  static TEST_DEFAULT_SPEED;

  /**
   * @typedef {Object} EventSpecVerbose - Listen for an event on element
   * @property {String} eventType - event name
   * @property {Element|string} element - element to attach listener to. Can use string 'body' if body.
   */
  /**
   * @typedef {EventSpecVerbose|string} EventSpec - String value is a shorthand for EventSpecVerbose where value is event name, and element is implied current element
   * 
   * @typedef {String} GestureState - enum 'idle'|'waiting'|'active'
   */
  /** @typedef Map<String, Array.<EventSpec>> */
  #myEventSpecs = new Map([
    ['idle', [/* 'pointerdown' */]],
    ['waiting', [/* 'pointermove', 'pointerleave', 'pointercancel'*/]],
    ['active', [/*'pointermove', 'pointerleave', 'pointercancel'*/]]
  ]);

  // GestureState handler keeps track of its state
  // Never change this value directly, always request state change from GestureManager
  myState = '';
  #element; // Element, default gesture target

  options = { // First argument to every callback is gesture handler.
    effect: new GestureEffect(),
    preventTextSelection: true, // should disable text selection when gesture is active?
    preventScrollOnMove: true, // shold disable default scroll on pointer move?
    inlineHandler: false  // true if this is an inline event handler
  };

  /**
   * @arg {Element} element - default gesture target
   * @arg {Object} options - GestureHandler options 
   * */
  constructor(element, options) {
    this.#element = element;
    if (options) {
      if ('effect' in options) {
        if (options.effect.gestureOptionOverrides)
        options = {...options, ...options.effect.gestureOptionOverrides()};
        this.options.effect = options.effect;
        for (let p of Object.getOwnPropertyNames(GestureEffect.prototype)
) {
          // Define required methods not defined by options.effect
          if (p != 'constructor' && !(p in this.options.effect)) {
            console.warn("GestureEffect did not define a function", p);
            this.options.effect[p] = () => {};
          }
        }
      }
      if ('preventTextSelection' in options)
        this.options.preventTextSelection = options.preventTextSelection;
      if ('preventScrollOnMove' in options)
        this.options.preventScrollOnMove = options.preventScrollOnMove;
      if ('inlineHandler' in options)
        this.options.inlineHandler = options.inlineHandler;
    }
  }

  /* OVERRIDES START - you can override following methods in your subclasses */

  /** @returns string */
  name() { return "GestureHandler"; }

  fullName() {
    let full = this.name();
    if (this.effect) {
      if (this.effect.name)
        full += ":" + this.effect.name();
      else
        full += ":UnnamedEffect";
    }
  }
  /**
   * @return {Element} - element created by gestureEffect
   */
  effectElement() {
    return this.options.effect.element();
  }

  preventTextSelection() { return this.options.preventTextSelection};

  preventDefaultScroll() {
    return this.options.preventScrollOnMove;
  }

  /**
   * Process gesture events. 
   * If you do not override this method, you need to implement handle(Idle|Wait|Active)Event
   * @arg {Event} event 
   * @returns {?GestureState} - new state if gesture would like to request a switch to new state.
   */
  handleEvent(ev) {
    switch(this.myState) {
      case 'idle': 
        return this.handleIdleEvent(ev);
      case 'waiting':
        return this.handleWaitEvent(ev);
      case 'active':
        return this.handleActiveEvent(ev);
      default:
        console.warn("Received event in unexpected state", this.state);
    }
  }

  /**
  * Which events should be processed in this GestureState?
  * @arg {GestureState} state - gesture state
  * @returns {Array.<EventSpec>} - listeners active in this state
  */
  eventSpecs(state) {
    return this.#myEventSpecs[state];
  }

  /* OVERRIDES END */

  element() { return this.#element; }

  setState(newState, event) {
    // console.log(this.name(), newState);
    if (this.myState == newState) {
      console.warn("setState noop", newState);
    }
    this.myState = newState;
    switch (this.myState) {
      case 'idle':
        this.options.effect.idleStart(this);
        break;
      case 'waiting':
        if (!event)
          console.error("WaitStart without an event");
        this.options.effect.waitStart(this, event);
        break;
      case 'active':
        this.options.effect.activeStart(this, event);
        break;
    }
  }

  getState() {
    return this.myState;
  }

  /** 
   * Utility function that returns all event types processed by this gesture.
   * Equivalent to calling eventTypes() for all states.
   * @returns Array[string] - all event types this gesture listens t.
  */
  allEventSpecs() {
    let m = new Map();
    for (let gs of ['idle', 'waiting', 'active']) {
      for (let evType of this.eventSpecs(gs))
        m.set(evType, true);
    }
    return m.keys();
  }
}
