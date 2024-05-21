/** 
 * DropEffect 
 * 
 * Implements 'drop' part of drag'n'drop.
 * Intended to be used as a dropEffect option to DragEffect.
 * 
 * Options:
 * 
 * 
 */

import GestureEffect from "./gestureEffect.js";
import appendStyleRule from "../gestureStyles.js"

let DROP_TARGET_HIGHLIGHT = "dropTargetHighlight";

// Default drop functions
// Not intended for real-world use, just something to show 
// if you forget to set these.
function defaultIsTarget(target, dragSource, ev) {
	if (target.getAttribute('data-drop-target'))
		return target != dragSource;
}

function defaultHighlight(target, highlightOn, dragSource, ev) {
	if (highlightOn)
		target.classList.add(DROP_TARGET_HIGHLIGHT)
	else
		target.classList.remove(DROP_TARGET_HIGHLIGHT);
}

function defaultDrop(target, dragSource, ev) {
	target.append(dragSource);
	return true;
}


export default class DropEffect extends GestureEffect {
/*
 * Design:
 * 
 * Drop has 3 main tasks:
 * 1) Find a drop target. Need to know:
 * - what is being dragged, dragSource: DragEffect passes this in
 * - is pointer over a target? (compute from event
 * 
 * 2) Highlight target while over it
 * 3) Drop on completed
 */

	dropTarget;	// Current drop target

	dropOptions = {
		isTarget: defaultIsTarget,
		highlight: defaultHighlight,
		drop: defaultDrop
	};

	constructor(options) {
		super(options);
		if (options) {
			if ('dropOptions' in options) {
				for (let p of ["isTarget", 'highlight', 'drop'])
					if (!(p in options.dropOptions))
						throw `DropEffect.options must specify ${p} callback`;
				this.dropOptions = options.dropOptions;
			}
			else {
				if ('isTarget' in options)
					this.dropOptions.isTarget = options.isTarget;
				if ('highlight' in options)
					this.dropOptions.highlight = options.highlight;
				if ('drop' in options)
					this.dropOptions.drop = options.drop;
			}
		}
	}

	#findDropTarget(gesture, ev, extras) {
		let candidates = document.elementsFromPoint(ev.clientX, ev.clientY);
		for (let t of document.elementsFromPoint(ev.clientX, ev.clientY)) {
			if (this.dropOptions.isTarget(t, extras.source, ev))
				return t;
		}
		return null;
	}

	clear(animate) {
		if (this.dropTarget) {
			this.dropOptions.highlight(this.dropTarget, false, extras.source, ev);
		}
	}

	idleStart() {}

	waitStart() {}

	activeStart(gesture, ev, extras) {}

	moved(gesture, ev, extras) {
		let newTarget = this.#findDropTarget(gesture, ev, extras);
		if (newTarget == this.dropTarget)
			return;
		if (this.dropTarget)
			this.dropOptions.highlight(this.dropTarget, false, extras.source, ev);
		this.dropTarget = newTarget;
		if (this.dropTarget)
			this.dropOptions.highlight(this.dropTarget, true, extras.source, ev);
	}

	completed(gesture, ev, extras) {
		let didDrop = false;
		if (this.dropTarget) {
			this.dropOptions.highlight(this.dropTarget, false, extras.source, ev);
			didDrop = this.dropOptions.drop(this.dropTarget, extras.source, ev);
			this.dropTarget = null;
		}
		this.clear(!didDrop);
		return didDrop;
	}
	cancelled(gesture, ev, extras) {
		this.clear();
	}
}

appendStyleRule(`.${DROP_TARGET_HIGHLIGHT}`, `{
  box-shadow: 0px 0px 9px 1px rgba(9,240,56,1);
}`);
