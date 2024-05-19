/**
 * Pinch gesture
 * 
 * Tracks two fingered pinch
 * 
 * Additional arguments to effect:
 * completedExtras, moveExtras  {
 *   scale: float // scale since start
 * }
 *
 * Demo effects:
 * ../effects/zoom.js
 *  
 * Pinch on desktop is interesting. Since there is no trackpad support,
 * desktop "pinches" with a scroll swipe that gets reported as a 'wheel' event.
 * Unlike pointer events, wheel does not have start/end events. 
 * I've picked mouseleave as the gesture end event for wheel.
 * Open to idea, it could be an option.
 * 
 * References:
 * https://kenneth.io/post/detecting-multi-touch-trackpad-gestures-in-javascript
 */

import GestureHandler from "./gestureHandler.js"

export default class PinchGesture extends GestureHandler {
  #myEventSpecs = new Map([
    ['idle', ['touchstart', "wheel"]],
    ['waiting', [
    	{ eventType: 'wheel'},
      { eventType: 'mouseleave' },
      { eventType: 'touchmove'},
      { eventType: 'touchend'},
      { eventType: 'touchcancel' }
      ]
    ],
    ['active', [
    	{ eventType: 'wheel' },
      { eventType: 'mouseleave' },
     	{ eventType: 'touchmove'},
      { eventType: 'touchend'},
      { eventType: 'touchcancel'}
      ]
    ]]);

 	wheelTotalY = 0;

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
	#wheelPixelsToScale() {
		const pixelScaleFactor = 3000;
		let scale = 1+this.wheelTotalY / pixelScaleFactor;
		// Need to keep wheelTotalY bounded by scale, because scale
		// should change visually when direction changes.
		if (scale < this.minScale) {
			this.wheelTotalY = parseInt((this.minScale - 1) * pixelScaleFactor);
		}
		if (scale > this.maxScale) {
			this.wheelTotalY = parseInt((this.maxScale - 1) * pixelScaleFactor);
		}
		return 1+this.wheelTotalY / pixelScaleFactor;
	}
	#computeExtras(ev) {
		let scale = ev.type == 'wheel' ? 
			this.#wheelPixelsToScale() : ev.scale;
		scale = Math.min(Math.max(this.minScale, scale), this.maxScale);
		return { scale: scale};
	}

	setState(newState, event) {
		super.setState(newState, event);
		if (newState == 'idle')
			this.wheelTotalY = 0;
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
		if (ev.type == 'wheel') {
			if (ev.deltaMode != WheelEvent.DOM_DELTA_PIXEL)
				return console.warn("why is wheel event not in pixels, but in ", ev.deltaMode);
			ev.preventDefault();
			this.wheelTotalY += event.wheelDeltaY;
			return 'waiting';
		}
		console.log("wheee");
	}

	handleWaitEvent(ev) {
		// logEvent(ev);
		if (ev.type == 'touchmove') {
			if (ev.touches.length != 2)
				return console.warn("LESS THAN 2 TOUCHES ", ev.touches.length);
			ev.preventDefault();
			this.options.effect.moved(this, ev, this.getState(), this.#computeExtras(ev));
			if (this.#aboveThreshold(ev.scale))
				return "active";
			return;
		}
		if (ev.type == "touchend" || ev.type == "touchcancel" || ev.type == "mouseleave") {
			this.options.effect.cancelled(this, ev);
			return "idle";
		}
		if (ev.type == 'wheel') {
			ev.preventDefault();
			this.wheelTotalY += event.wheelDeltaY;
			this.options.effect.moved(this, ev, this.getState(), this.#computeExtras(ev));
			return "active";
		}
		console.warn("Unexpected wait event ", ev.type);
	}

	handleActiveEvent(ev) {
		if (ev.type == "touchmove") {
			if (ev.touches.length != 2)
				console.warn("LESS THAN 2 TOUCHES ", ev.type, ev.touches.length);
			ev.preventDefault();
			this.options.effect.moved(this, ev, this.getState(), this.#computeExtras(ev));
			return;
		}
		if (ev.type == "touchend") {
			this.options.effect.completed(this,ev, this.#computeExtras(ev));
			return "idle";
		}
		if (ev.type == "touchcancel") {
			this.options.effect.cancelled(this, ev);
			return "idle";
		}
		if (ev.type == "wheel") {
			this.wheelTotalY += event.wheelDeltaY;
			this.options.effect.moved(this, ev, this.getState(), this.#computeExtras(ev));
			ev.preventDefault();
			return;
		}
		if (ev.type == "mouseleave") {
			this.options.effect.completed(this,ev, this.#computeExtras(ev));
			return "idle";
		}

	}
}
