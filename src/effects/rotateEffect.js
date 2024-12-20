/** 
 * RotateEffect 
 * 
 * Rotates an element.
 * 
 */

import GestureEffect from "./gestureEffect.js";

export default class RotateEffect extends GestureEffect {

	rotateTarget; // Element being rotated
	
	constructor(options) {
		super(options);
	}

	name() {
		return "Rotate";
	}

	#parseTransform() {
    let parse = this.rotateTarget.style.transform.match(/(.*)rotate\(([^\)]+)\)(.*)/);
    if (parse) {
    	return {
    		prefix:parse[1], 
    		currentDeg:parseInt(parse[2]), 
    		postfix:parse[3]
    	};
    } else {
    	return {prefix:'', currentDeg: 0, postfix:''};
	  }
  }

	animateTargetToRotation(rotation, duration=GestureEffect.ANIM_TIME) {
		let animOptions = {
		  duration: duration,
		  easing: 'ease-out'
		};
		for (let a of this.rotateTarget.getAnimations()) {
      // console.log("cancelling animations!");
      a.cancel();
    }
    let finalRotation = this.initalDegrees + rotation;
    let preT = this.#parseTransform();
    let animation = this.rotateTarget.animate([
    		{transform: `${preT.prefix}rotate(${preT.currentDeg}deg)${preT.postfix}`},
    		{transform: `${preT.prefix}rotate(${finalRotation}deg)${preT.postfix}`}
  		], animOptions);
    animation.finished.finally( _ => {
    	// Reparse transform, in case someone else changed it
    	let postT = this.#parseTransform();
    	this.rotateTarget.style.transform = `${postT.prefix}rotate(${finalRotation}deg)${postT.postfix}`;
    }).catch(err => {
    	// console.log("Animation cancelled");
      // error gets thrown if animation is cancelled
    });
    return animation;
	}

	clear(animate) {
		// Leave the end result as is?

		// let cleanup = () => this.rotateTarget.style.transform = "";
		// if (animate) {
		// 	this.animateTargetToRotation(0).finished
		// 		.then(cleanup)
		// 		.catch( _ => {});
		// } else {
		// 	cleanup();
		// }
	}

	idleStart(gesture) {
		if (!this.rotateTarget)
			this.rotateTarget = gesture.element();
	}
	waitStart() {}
	activeStart() {
		this.initalDegrees = this.#parseTransform().currentDeg;
	}

	moved(gesture, ev, extras) {
		if (gesture.getState() != 'active')
			return;
		this.animateTargetToRotation(extras.rotation, 0);
	}

	completed(gesture, ev) {
		this.clear(true);
	}
	cancelled(gesture, ev) {
		this.clear();
	}
}
