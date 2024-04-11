/**
 * GestureHandler
 * 
 * GestureManager expects all gestures to implement GestureHandler API.
 * Subclass this class if you are defining your own gesture.
 */
import GestureEffect from "../effects/gestureEffect.js";

export default class GestureHandler {
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
    effects: new GestureEffect(),
    textSelectionEnabled: false, // should text selection be disabled during gesture?
  };

  /**
   * @arg {Element} element - default gesture target
   * @arg {Object} options - GestureHandler options 
   * */
  constructor(element, options) {
    this.#element = element;
    if (options) {
      if ('effects' in options)
        this.options.effects = options.effects;
      if ('textSelectionEnabled' in options)
        this.options.textSelectionEnabled = options.textSelectionEnabled;
    }
  }

  /* OVERRIDES START - override following methods in your subclasses */

  /** @returns string */
  name() { return ""; }

  textSelectionEnabled() { return this.options.textSelectionEnabled};
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

  setState(newState) {
    if (this.myState == newState) {
      console.warn("setState noop", newState);
    }
    this.myState = newState;
    switch (this.myState) {
      case 'idle':
        this.options.effects.idleStart(this);
        break;
      case 'waiting':
        if (this.options.waitStartPartial) {
          this.options.waitStartPartial();
          delete this.options.waitStartPartial;
        } else {
          if (this.options.effects.waitStart)
            console.warn("GestureHandler did not create waitStartPartial");
        }
        break;
      case 'active':
        if (this.options.activeStartPartial) {
          this.options.activeStartPartial();
          delete this.options.activeStartPartial;
        } else {
          if (this.options.effects.activeStart)
            console.warn("GestureHandler did not create activeStartPartial");
        }
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

  // Sets up a partial callback. Used to save arguments to state callbacks,
  // when they are called later.
  makePartialCallback(name, ...args) {
    if (['activeStart', 'waitStart'].indexOf(name) == -1) 
      console.warn("Bad name argument to makePartialCallback ", name);
    if (this.options.effects[name]) {
      let fn = this.options.effects[name].bind(this.options.effects);
      this.options[name + "Partial"] = () => {
        return fn(...args);
      }
    }
  }
}
