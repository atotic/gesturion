/**
 * Rotate gesture
 *
 * Rotate currently only works for touch screens,
 * Trackpad does not expose any multitouch events.
 * 
 * To make it work with mouse, effect would have to display 
 * rotation UI. 
 * TODO: implement desktop variant, maybe a rotate cursor with cmd key down
 * 
 * References:
 * https://kenneth.io/post/detecting-multi-touch-trackpad-gestures-in-javascript
 */

import GestureHandler from "./gestureHandler.js"
import {logEvent} from "../../test/testUtils.js"

export default class RotateGesture extends GestureHandler {
  #myEventSpecs = new Map([
    ['idle', ['touchstart']],
    ['waiting', [
      { eventType: 'touchmove'},
      { eventType: 'touchend'},
      { eventType: 'touchcancel' }
      ]
    ],
    ['active', [
     	{ eventType: 'touchmove'},
      { eventType: 'touchend'},
      { eventType: 'touchcancel'}
      ]
    ]]);
  threshold = 2;

  constructor(element, options) {
  	super(element, options);
  }
  name() {
  	return "Rotate";
  }
	eventSpecs(state) {
	  return this.#myEventSpecs.get(state);
	}

	#aboveThreshold(ev) {
		return this.threshold == 0 || (Math.abs(ev.rotation) > this.threshold);
	}

	handleIdleEvent(ev) {
		// logEvent(ev);
		if (ev.type == 'touchstart') {
			if (ev.touches.length == 2) {
				if (this.#aboveThreshold(ev))
					return "active";
				else
					return "waiting";
			}
		}
	}

	handleWaitEvent(ev) {
		// logEvent(ev);
		if (ev.type == 'touchmove') {
			if (ev.touches.length != 2)
				console.warn("LESS THAN 2 TOUCHES ", ev.touches.length);
						ev.preventDefault();
			this.options.effect.moved(this, ev, this.getState(), ev.rotation);
			if (this.#aboveThreshold(ev))
				return "active";
			return;
		}
		if (ev.type == "touchend" || ev.type == "touchcancel") {
			this.options.effect.cancelled(this, ev);
			return "idle";
		}
		console.warn("Unexpected wait event ", ev.type);
	}

	handleActiveEvent(ev) {
		if (ev.type == "touchmove") {
			if (ev.touches.length != 2)
				console.warn("LESS THAN 2 TOUCHES ", ev.type, ev.touches.length);
			ev.preventDefault();
			this.options.effect.moved(this, ev, this.getState(), ev.rotation);
			return;
		}
		if (ev.type == "touchend") {
			this.options.effect.completed(this,ev, ev.rotation);
			return "idle";
		}
		if (ev.type == "touchcancel") {
			this.options.effect.cancelled(this, ev);
			return "idle";
		}
	}
}
