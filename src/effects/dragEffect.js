/** 
 * DragEffect 
 * 
 * Drags an element using transforms
 * 
 */

import GestureEffect from "./gestureEffect.js";

export default class DragEffect extends GestureEffect {

	dragTarget; // element being dragged

	constructor(options) {
		super(options);
	}

	#parseTransform() {
    let parse = this.dragTarget.style.transform.match(/(.*)translate\(([^\)]+)\)(.*)/);
    if (parse) {
    	// now parse 123px, 23px
    	let spl = parse[2].split(',');
			let x = 0, y = 0;
    	if (spl.length == 2) {    	
    		x = parseInt(spl[0]);
    		y = parseInt(spl[1]);
    		if (x == NaN) 
    			console.warn("could not parse x", spl[0]);
    		if (y == NaN) 
    			console.warn("could not parse y", spl[1]);
    	}
    	return {
    		prefix:parse[1], 
    		x: x,
    		y: y, 
    		postfix:parse[3]
    	};
    } else {
    	return {prefix:'', x: 0, y: 0, postfix:''};
	  }
  }

  animateTargetToLocation(x, y, duration=GestureEffect.ANIM_TIME) {
  	let animOptions = {
		  duration: duration,
		  easing: 'ease-out'
		};
		for (let a of this.dragTarget.getAnimations())
      a.cancel();
    let preT = this.#parseTransform();
    x = x.toFixed(0);
    y = y.toFixed(0);
    let animation = this.dragTarget.animate([
    		{transform: `${preT.prefix}translate(${preT.x}px,${preT.y}px)${preT.postfix}`},
    		{transform: `${preT.prefix}translate(${x}px,${y}px)${preT.postfix}`}
  		], animOptions);
    animation.finished.finally( _ => {
    	// Reparse transform, in case someone else changed it
    	let postT = this.#parseTransform();
    	this.dragTarget.style.transform = `${postT.prefix}translate(${x}px,${y}px)${postT.postfix}`;
    }).catch(err => {
    	console.log(err);
      // error gets thrown if animation is cancelled
    });
    return animation;
  }

  clear(animate) {
  	let cleanup = () => this.dragTarget.style.transform = "";
		if (animate) {
			this.animateTargetToLocation(0,0).finished
				.then(cleanup)
				.catch( _ => {});
		} else {
			cleanup();
		}
  }

	idleStart(gesture) {
		if (!this.dragTarget)
			this.dragTarget = gesture.element();
	}

	waitStart() {}
	activeStart() {}

	moved(gesture, ev, state, extras) {
		if (gesture.getState() != 'active')
			return;
		this.animateTargetToLocation(extras.deltaX, extras.deltaY, 0);
	}

	completed(gesture, ev) {
		this.clear(true);
	}
	cancelled(gesture, ev) {
		this.clear();
	}
}
