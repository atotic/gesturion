/** 
 * HighlightEffect 
 * 
 * Highlights element on activation
 * 
 */

import GestureEffect from "./gestureEffect.js";

export default class HighlightEffect extends GestureEffect {

	constructor(options) {
		super(options);
		if (options) {
			if ('highlightClass' in options)
				this.highlightClass = options.highlightClass;
		}
	}

	clear(animate) {}

	idleStart(gesture) {}
	waitStart() {}
	activeStart(gesture) {
		let el = gesture.element();
		if (!el)
			return console.warn("No element to highlight");

		let animOptions = {
      duration: GestureEffect.ANIM_TIME,
      easing: 'ease-out'
    };
    for (let a of el.getAnimations())
      a.cancel();
    let animation = el.animate([
      {
    		transform: "scale(1.0)" 
    	},
      {
      	backgroundColor: "Highlight",
      	transform: "scale(1.3)"
      },
      {
      	transform: "scale(1.0)"
      }
    ], animOptions);
    animation.finished.finally( _ => {
    }).catch( err => {
      // console.log("Animation cancelled");
      // error gets thrown if animation is cancelled
    });
	}

	moved(gesture, ev, extras) {}
	completed(gesture, ev) {}
	cancelled(gesture, ev) {}
}
