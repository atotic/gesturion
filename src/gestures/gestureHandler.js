/**
 * GestureHandler
 * 
 * GestureManager uses GestureHandlers to work with gestures.
 * If you are defining your own GestureHandler, you can use
 * GestureHandler as a superclass for your gesture.
 * Or you can use it as a template.
 */
/**
 * GestureHandler interface
 * Works with GestureManager to implement gestures.
 */
export default class GestureHandler {
  /**
   * @typedef {Object} EventSpecVerbose - Listen for an event on element
   * @property {String} eventType - event name
   * @property {Element} element - element to attach listener to
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
    idleStart: null,  // idle state begins. f(handler)
    waitStart: null,  // wait state begins  f(handler, event)
    activeStart: null,// active state begins f(handler, event)
    moved: null, // move happened f(handler, event, gestureHandlerState)
    completed: null,  // gesture has been completed, usually at the end of active state
    cancelled: null,  // gesture has been cancelled
    textSelectionEnabled: false, // should text selection be disabled during gesture?
  };

  /**
   * @arg {Element} element - default gesture target
   * @arg {Object} options - GestureHandler options 
   * */
  constructor(element, options) {
    this.#element = element;
    if (options) {
      this.options.idleStart = options.idleStart;
      this.options.waitStart = options.waitStart;
      this.options.activeStart = options.activeStart;
      this.options.moved = options.moved;
      this.options.completed = options.completed;
      this.options.cancelled = options.cancelled;
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
        if (this.options.idleStart)
          this.options.idleStart(this);
        break;
      case 'waiting':
        if (this.options.waitStartPartial) {
          this.options.waitStartPartial();
          delete this.options.waitStartPartial;
        } else {
          if (this.options.waitStart)
            console.warn("GestureHandler did not create waitStartPartial");
        }
        break;
      case 'active':
        if (this.options.activeStartPartial) {
          this.options.activeStartPartial();
          delete this.options.activeStartPartial;
        } else {
          if (this.options.activeStart)
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
    if (this.options[name]) {
      let fn = this.options[name];
      this.options[name + "Partial"] = () => {
        return fn(...args);
      }
    }
  }
}
