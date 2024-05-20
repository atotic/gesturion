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
 * Clarity for gestureEffect extras
 * 1) Lead with tests,
 * - unconstrained drag tests
 * - constrain direction
 * - constrain rectangle
 * 
 */

import GestureHandler from "./gestureHandler.js"

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

  threshold = 3; // travel at least this much before activation
  direction = "both"; // horizontal|vertical|both

  startLocation = {	// Initial poiinterdown location
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
  /**
   * @param {Object} options 
   * @param {number} options.threshold - how far to move before swipe activates
   * @param {string} options.direction - 
   * @param {*} options.* - see GestureHandler.constructor options
   */

  constructor(element, options) {
    // Options: callbacks for start, move, cancel, complete, threshold
    super(element, options);
    if ('effect' in options)
      options = {...options, ...options.effect.gestureOptionOverrides()};
    if ('threshold' in options)
      this.threshold = parseInt(options.threshold);
    if ('direction' in options) {
      if (['horizontal', 'vertical', 'both'].indexOf(options.direction) == -1)
        throw `Invalid options.direction "${options.direction}"`;
      this.direction = options.direction;
    }
  }

	#updatePointerInfo(ev) {
    if (this.pointerInfo.x != -1) {
    	// Previous info exists, can compute speed
      let timeDelta = Math.max(ev.timeStamp - this.pointerInfo.timeStamp, 1);
      this.pointerInfo.speedX = (ev.pageX - this.pointerInfo.x) * 100 / timeDelta;
      this.pointerInfo.speedY = (ev.pageY - this.pointerInfo.y) * 100 / timeDelta;
    } else {
    	this.pointerInfo.speedX = 0;
    	this.pointerInfo.speedY = 0;
    }
    if (GestureHandler.TEST_DEFAULT_SPEED) {
    	this.pointerInfo.speedX = GestureHandler.TEST_DEFAULT_SPEED;
    	this.pointerInfo.speedY = GestureHandler.TEST_DEFAULT_SPEED;
    }
    this.pointerInfo.x = ev.pageX;
    this.pointerInfo.y = ev.pageY;
    this.pointerInfo.timeStamp = ev.timeStamp;
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
  	return {
  		startX: this.startLocation.offsetX,
  		startY: this.startLocation.offsetY,
  		pageX: ev.pageX,
  		pageY: ev.pageY,
 			deltaX: ev.pageX - this.startLocation.pageX,
 			deltaY: ev.pageY - this.startLocation.pageY,
	  	speedX: this.pointerInfo.speedX,
	  	speedY: this.pointerInfo.speedY
	  };
  }
  handleWaitEvent(ev) {
    if (ev.type == 'pointermove') {
    	this.#updatePointerInfo(ev);
      this.options.effect.moved( this, ev, this.getState(), this.#moveExtras(ev));
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
      this.options.effect.moved(this, ev, this.getState(), this.#moveExtras(ev));
      return;
    }
    if (ev.type == 'pointercancel' || ev.type == 'pointerleave') {
      this.options.effect.cancelled(this, ev);
      return "idle";
    }
    console.warn("unexpected active event", ev.type);
  }
}
