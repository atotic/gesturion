/** 
 * DragEffect 
 * 
 * Drags an element, uses transform()
 * 
 * Can be combined with dropEffect option to implement drag'n'drop.
 * 
 * This implementation of drag'n'drop does not cover all the details
 * that go into full d'n'd implementation. For example:
 * - dragged item often need a z-index:1 to keep it in front of other elements
 * - what happens when you drop: 
 *   - is element cloned, removed, how are its styles cleared up
 * 
 * It can be used an inspiration for a complete d'n'd implementation.
 */

import GestureEffect from "./gestureEffect.js";

export default class DragEffect extends GestureEffect {

	dragTarget; // element being dragged

	// Options
	dropEffect;	// Deals with drops
	noZIndex = false;
	constructor(options) {
		super(options);
		if (options) {
			if ('dropEffect' in options)
				this.dropEffect = options.dropEffect;
			if ('noZIndex' in options)
				thks.noZIndex = options.noZIndex;
		}
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

  #dropExtras(gesture) {
  	return {source: gesture.element()};
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
    if (!this.noZIndex) {
    	this.dragTarget.style.position = 'relative';
	    this.dragTarget.style.zIndex = 1;
	  }
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
  	let cleanup = () => {
  		this.dragTarget.style.transform = "";
	    if (!this.noZIndex) {
	    	this.dragTarget.style.position = '';
		    this.dragTarget.style.zIndex = '';
		  }
  	}
		if (animate) {
			this.animateTargetToLocation(0,0).finished
				.then(cleanup)
				.catch( _ => {});
		} else {
			cleanup();
		}
		if (this.dropEffect)
			this.dropEffect.clear(animate);
  }

	idleStart(gesture) {
		if (!this.dragTarget)
			this.dragTarget = gesture.element();
		if (this.dropEffect)
			this.dropEffect.idleStart(gesture);
	}
	waitStart(gesture, ev) {
		if (this.dropEffect)
			this.dropEffect.waitStart(gesture, ev);
	}
	activeStart(gesture, ev) {
		if (this.dropEffect)
			this.dropEffect.activeStart(gesture, ev, this.#dropExtras(gesture));		
	}

	moved(gesture, ev, extras) {
		if (gesture.getState() != 'active')
			return;
		this.animateTargetToLocation(extras.deltaX, extras.deltaY, 0);
		if (this.dropEffect)
			this.dropEffect.moved(gesture, ev, this.#dropExtras(gesture));		
	}
	completed(gesture, ev) {
		let dropMethod;
		if (this.dropEffect)
			dropMethod = this.dropEffect.completed(gesture, ev, this.#dropExtras(gesture));
		let animate = !dropMethod || dropMethod == 'copy';
		this.clear(animate);
	}
	cancelled(gesture, ev) {
		if (this.dropEffect)
			this.dropEffect.cancelled(gesture, ev, this.#dropExtras(gesture));		
		this.clear();
	}
}
