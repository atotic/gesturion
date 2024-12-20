/**
 * Drag gesture
 * 
 * Pointer drag, with a variety of constraints
 * 
 * Additinal effect arguments:
 * 
 * completedExtras, moveExtras {
 *   startX, startY,  // initial mouseDown location 
 *   pageX, pageY,		// current page coordinates
 *   deltaX, deltaY,  // change from start
 *   speedX, speedY,  // speed, pixels/100ms
 * } 
 * 
 * TODO:
 * - constrain rectangle
 */

import GestureHandler from "./gestureHandler.js"
import GestureManager from "../gestureManager.js"

export default class Drag extends GestureHandler {

  #myEventSpecs = new Map([
    ['idle', ['pointerdown']],
    ['waiting', [
      { eventType: 'pointermove', element: 'body' },
      { eventType: 'pointerleave', element: 'body' },
      { eventType: 'pointercancel', element: 'body' },
      { eventType: 'pointerup', element: 'body' }
      ]
    ],
    ['active', [
      { eventType: 'pointermove', element: 'body' },
      { eventType: 'pointerleave', element: 'body' },
      { eventType: 'pointercancel', element: 'body' },
      { eventType: 'pointerup', element: 'body' }
      ]
    ]]);

  startLocation = { // Initial poiinterdown location
    pageX: -1,
    pageY: -1,
    offsetX: -1, // MouseEvent.offsetX, padding edge coordinates
    offsetY: -1
  }

  pointerInfo = { // pointer information
    x: -1,
    y: -1,
    timeStamp: 0, 
    speedX: 0,
    speedY: 0
  };
  #boundTimeoutCb;
  // Options
  threshold = 3; // travel at least this much before activation
  timeoutThreshold; // activate after timeout milliseconds if no pointer movement.
  direction = "both"; // horizontal|vertical|both

  /**
   * @param {Object} options 
   * @param {number} options.threshold - how far to move before swipe activates
   * @param {number} options.timeoutThreshold - if set, activate after timeout ms, if no pointer movement 
   * @param {string} options.direction - horizontal, vertical, or both
   * @param {*} options.* - see GestureHandler.constructor options
   */

  constructor(element, options) {
    // Options: callbacks for start, move, cancel, complete, threshold
    super(element, options);
    if ('effect' in options)
      options = {...options, ...options.effect.gestureOptionOverrides()};
    if ('threshold' in options)
      this.threshold = parseInt(options.threshold);
    if ('timeoutThreshold' in options)
      this.timeoutThreshold = parseInt(options.timeoutThreshold);
    if ('direction' in options) {
      if (['horizontal', 'vertical', 'both'].indexOf(options.direction) == -1)
        throw `Invalid options.direction "${options.direction}"`;
      this.direction = options.direction;
    }
  }

  #constrainedPageCoords(ev) {
    let c = {
      pageX: ev.pageX,
      pageY: ev.pageY
    };
    if (this.direction == 'horizontal')
      c.pageY = this.startLocation.pageY;
    else if (this.direction == 'vertical')
      c.pageX = this.startLocation.pageX;
    return c;
  }
	#updatePointerInfo(ev) {
    let c = this.#constrainedPageCoords(ev);
    if (this.pointerInfo.x != -1) {
    	// Previous info exists, can compute speed
      let timeDelta = Math.max(ev.timeStamp - this.pointerInfo.timeStamp, 1);
      this.pointerInfo.speedX = (c.pageX - this.pointerInfo.x) * 100 / timeDelta;
      this.pointerInfo.speedY = (c.pageY - this.pointerInfo.y) * 100 / timeDelta;
    } else {
    	this.pointerInfo.speedX = 0;
    	this.pointerInfo.speedY = 0;
    }
    if (GestureHandler.TEST_DEFAULT_SPEED) {
    	this.pointerInfo.speedX = GestureHandler.TEST_DEFAULT_SPEED;
    	this.pointerInfo.speedY = GestureHandler.TEST_DEFAULT_SPEED;
    }
    this.pointerInfo.x = c.pageX;
    this.pointerInfo.y = c.pageY;
    this.pointerInfo.timeStamp = ev.timeStamp;
  }

  timeoutCb() {
    delete this.timeoutId;
    // console.log("timeoutCb");
    if (this.getState() != 'active')
      GestureManager.requestStateChange(this, 'active');
  }
  #startTimeout() {
    // console.log("startTimeout");
    if (this.timeoutId) {
      console.warn("duplicate call to startTimedThreshold");
      this.#stopTimeout()
    }
    if (!this.#boundTimeoutCb)
      this.#boundTimeoutCb = this.timeoutCb.bind(this);
    this.timeoutId = window.setTimeout(this.#boundTimeoutCb, this.timeoutThreshold);
  }
  #stopTimeout() {
    // console.log("stopTimeout");
    if (!('timeoutId' in this))
      return;
    window.clearTimeout(this.timeoutId);
    delete this.timeoutId;
  }
  setState(newState, event) {
    super.setState(newState, event);
    if (this.timeoutThreshold > 0) {
      if (newState == 'waiting')
        this.#startTimeout();
      else
        this.#stopTimeout();
    }
  }

  name() {
    return "Drag";
  }

  eventSpecs(state) {
    return this.#myEventSpecs.get(state);
  }

  handleIdleEvent(ev) {
    if (ev.type == 'pointerdown') {
      this.startLocation = {
      	pageX: ev.pageX,
		  	pageY: ev.pageY,
		  	offsetX: ev.offsetX,
		  	offsetY: ev.offsetY
      };
      this.#updatePointerInfo(ev);
      if (this.threshold == 0 || this.options.effect.hasVisibleEffect())
        return "active";
      return 'waiting';
    }
    console.warn("Unexpected idle event", ev.type);
  }
  
  #aboveThreshold(ev) {
  	let maxDelta = Math.max(
  		Math.abs(ev.pageX - this.startLocation.pageX),
  		Math.abs(ev.pageY - this.startLocation.pageY));
    return maxDelta >= this.threshold;
  }
  #moveExtras(ev) {
    let c = this.#constrainedPageCoords(ev);
  	return {
  		startX: this.startLocation.offsetX,
  		startY: this.startLocation.offsetY,
  		pageX: c.pageX,
  		pageY: c.pageY,
 			deltaX: c.pageX - this.startLocation.pageX,
 			deltaY: c.pageY - this.startLocation.pageY,
	  	speedX: this.pointerInfo.speedX,
	  	speedY: this.pointerInfo.speedY
	  };
  }
  handleWaitEvent(ev) {
    if (ev.type == 'pointermove') {
    	this.#updatePointerInfo(ev);
      this.options.effect.moved( this, ev, this.#moveExtras(ev));
      if (this.#aboveThreshold(ev))
        return 'active';
      return;
    }
    if (ev.type == 'pointerleave' || ev.type == 'pointercancel' || ev.type == 'pointerup') {
      this.options.effect.cancelled(this, ev);
      return "idle";
    }
    console.warn("Unexpected wait event", ev.type);
  }

  handleActiveEvent(ev) {
    if (ev.type == 'pointerup') {
      this.options.effect.completed(this, ev, this.#moveExtras(ev));
      return "idle";
    }
    if (ev.type == 'pointermove') {
      this.options.effect.moved(this, ev, this.#moveExtras(ev));
      return;
    }
    if (ev.type == 'pointercancel' || ev.type == 'pointerleave') {
      this.options.effect.cancelled(this, ev);
      return "idle";
    }
    console.warn("unexpected active event", ev.type);
  }
}
