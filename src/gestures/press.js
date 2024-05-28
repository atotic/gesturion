/**
 * Press gesture
 * 
 * Press and hold for a specified time.
 * On press, gesture will enter waiting state,
 * and activate after a `timeout`, then go back to idle.
 *
 * Usage:
 * 
 * 
 */

import GestureHandler from "./gestureHandler.js"
import GestureManager from "../gestureManager.js"

export default class PressGesture extends GestureHandler {
/*
Implementation notes:

Press activation cycle is unusual for a gesture.
Most of the time is spent in 'waiting' state, waiting for a timeout.

When timeout fires, it briefly enters active state, fires action,
then goes back to idle.

How to implement 'activate on timeout'? 
A) GestureManager needs to be aware of the state change, so that
it can cancel other waiting gestures.

B) Future work: long press might be combined with another gesture,
that should enter active state right after the long press fires. 

Implementation
timeoutCb
  GestureManager.requestStateChange(active) -- returns true if request is granted
  GestureManager.requestStateChange(idle) -- 
*/
 #myEventSpecs = new Map([
    ['idle', ['pointerdown']],
    ['waiting', [
      { eventType: 'pointermove'},
      { eventType: 'pointerleave'},
      { eventType: 'pointercancel'},
      { eventType: 'pointerup'}
      ]
    ],
    ['active', [ 
      // Active state instantly goes back to idle
      ]
    ]]);

    #boundTimeoutCb;
 		startLocation = { pageX: -1, pageY: -1 };

 		// Options
    threshold = 3; // Cancel press if travel is more than treshold
    timeout = 1000; // When should press trigger

  constructor(element, options) {
  	super(element, options);
    if (options) {
    	if ('threshold' in options)
        this.threshold = parseInt(options.threshold);
      if ('timeout' in options) {
      	this.timeout = parseInt(options.timeout);
        if (this.timeout <=0)
          throw `Press timeout must be greated than 0 (${this.timeout})`;
      }
    }
  }

  name() {
  	return "Press";
  }
  eventSpecs(state) {
  	return this.#myEventSpecs.get(state);
  }

  #aboveThreshold(ev) {
  	let maxDelta = Math.max(
  		Math.abs(ev.pageX - this.startLocation.pageX),
  		Math.abs(ev.pageY - this.startLocation.pageY));
    return maxDelta >= this.threshold;
  }

  timeoutCb() {
    delete this.timeoutId;
    GestureManager.requestStateChange(this, 'active');
    GestureManager.requestStateChange(this, 'idle');
  }

  #startWaiting() {
  	if (this.timeoutId) {
  		console.warn("duplicate call to startWaiting");
  		this.#stopWaiting();
  	}
    if (!this.#boundTimeoutCb)
      this.#boundTimeoutCb = this.timeoutCb.bind(this);
    this.timeoutId = window.setTimeout(this.#boundTimeoutCb, this.timeout);
  }
  #stopWaiting() {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
      delete this.timeoutId;
    }
  }

  setState(newState, event) {
  	super.setState(newState, event);
  	if (this.getState() == 'waiting') {
  		this.#startWaiting();
  	} else {
  		this.#stopWaiting();
  	}
  }

  handleIdleEvent(ev) {
  	this.startLocation = {pageX: ev.pageX, pageY: ev.pageY};
  	return 'waiting';
  }

  handleWaitEvent(ev) {
  	if (ev.type == 'pointermove' && !this.#aboveThreshold(ev)) {
  		return;	// Little movement does not cancel
    }
  	this.#stopWaiting();
  	return 'idle'; // Any other event cancels it
  }

  handleActiveEvent(ev) {
  	throw "Why is PressGesture active?";
  }
}

