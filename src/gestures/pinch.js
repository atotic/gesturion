/**
 * Pinch gesture
 * 
 * Tracks two fingered zoom.
 * 
 * Demo effects:
 * ../effects/zoom.js
 * 
 * References:
 * https://kenneth.io/post/detecting-multi-touch-trackpad-gestures-in-javascript
 */

import GestureHandler from "./gestureHandler.js"

export default class PinchGesture extends GestureHandler {
  #myEventSpecs = new Map([
    ['idle', ['touchstart', "wheel"]],
    ['waiting', [
    	{ eventType: 'wheel' },
      { eventType: 'touchmove'},
      { eventType: 'touchend'},
      { eventType: 'touchcancel' }
      ]
    ],
    ['active', [
    	{ eventType: 'wheel' },
     	{ eventType: 'touchmove'},
      { eventType: 'touchend'},
      { eventType: 'touchcancel'}
      ]
    ]]);

  threshold = 0.1;	// TouchEvent.scale units (0.1 means scale between 1.1 and 0.9 works
  minScale = 0.1;
  maxScale = 2;

  constructor(element, options) {
  	super(element, options);
  	if ('threshold' in options)
			this.threshold = threshold;
		if ('minScale' in options)
			this.minScale = parseFloat(options.minScale);
		if ('maxScale' in options)
			this.maxScale = parseFloat(options.maxScale);
  }
  name() {
  	return "Rotate";
  }
	eventSpecs(state) {
	  return this.#myEventSpecs.get(state);
	}
	#aboveThreshold(scale) {
		return this.threshold == 0 || (Math.abs(scale -1) > this.threshold);
	}
	#clamp(scale) {
		return Math.min(Math.max(this.minScale, scale), this.maxScale);
	}
	handleIdleEvent(ev) {
		if (ev.type == 'touchstart') {
			if (ev.touches.length == 2) {
				if (this.#aboveThreshold(ev.scale))
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
				return console.warn("LESS THAN 2 TOUCHES ", ev.touches.length);
			ev.preventDefault();
			this.options.effect.moved(this, ev, this.getState(), this.#clamp(ev.scale));
			if (this.#aboveThreshold(ev.scale))
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
			this.options.effect.moved(this, ev, this.getState(), this.#clamp(ev.scale));
			return;
		}
		if (ev.type == "touchend") {
			this.options.effect.completed(this,ev, this.#clamp(ev.scale));
			return "idle";
		}
		if (ev.type == "touchcancel") {
			this.options.effect.cancelled(this, ev);
			return "idle";
		}
	}
}
