/** 
 * ZoomEffect 
 * 
 * Zooms an element using transforms
 * 
 * Works with PinchGesture.
 */

import GestureEffect from "./gestureEffect.js";

export default class ZoomEffect extends GestureEffect {

	zoomTarget;	// Element being zoomed
	
	constructor(options) {
		super(options);
	}

	parseTransform() {
    let parse = this.zoomTarget.style.transform.match(/(.*)scale\(([^\)]+)\)(.*)/);
    if (parse) {
    	return {
    		prefix: parse[1], 
    		scale: parseFloat(parse[2]), 
    		postfix: parse[3]
    	};
    } else {
    	return {prefix:'', scale: 1.0, postfix:''};
	  }
  }

  animateTargetToScale(scale, duration=GestureEffect.ANIM_TIME) {
		let animOptions = {
		  duration: duration,
		  easing: 'ease-out'
		};
		for (let a of this.zoomTarget.getAnimations()) {
      // console.log("cancelling animations!");
      a.cancel();
    }
    let preT = this.parseTransform();
    let animation = this.zoomTarget.animate([
    		{transform: `${preT.prefix}scale(${preT.scale})${preT.postfix}`},
    		{transform: `${preT.prefix}scale(${scale})${preT.postfix}`}
  		], animOptions);
    animation.finished.finally( _ => {
    	let postT = this.parseTransform();
    	this.zoomTarget.style.transform = `${postT.prefix}scale(${scale})${postT.postfix}`;
    }).catch(err => {
    	// console.log("Animation cancelled");
      // error gets thrown if animation is cancelled
    });
    return animation;
	}

	clear(animate) {
		let cleanup = () => this.zoomTarget.style.transform = "";
		if (animate) {
			this.animateTargetToScale(1.0).finished
				.then(cleanup)
				.catch( _ => {});
		} else {
			cleanup();
		}
	}

	idleStart(gesture) {
		if (!this.zoomTarget)
			this.zoomTarget = gesture.element();
	}
	waitStart() {}
	activeStart() {
		this.initalScale = this.parseTransform().scale;
	}

	moved(gesture, ev, state, extras) {
		if (gesture.getState() != 'active')
			return;
		this.animateTargetToScale(extras.scale, 0);
	}

	completed(gesture, ev) {
		this.clear(true);
	}
	cancelled(gesture, ev) {
		this.clear();
	}

}
