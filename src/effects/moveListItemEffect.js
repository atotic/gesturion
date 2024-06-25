/** 
 * DropListItemEffect 
 * 
 * Implements 'drop' dropping part of dragging the list item.
 * 
 * Moves other items out of the way.
 * 
 */

import GestureEffect from "./gestureEffect.js";
// import appendStyleRule from "../gestureStyles.js"

function defaultDrop() {
	console.log("DROPPING");
}

export default class MoveListItemEffect extends GestureEffect {

	// Options
	dropCallback = defaultDrop;
	listContainer = null;	// Element that contains all the list items.
	listElementSelector = ""; // CSS selector for list items. listContainer.querySelector(listElementSelector) shoudl return all list items.

	constructor(options) {
		super(options);
		if (options) {
			if ('dropCallback' in options)
				this.dropCallback = options.dropCallback;
			if ('listContainer' in options)
				this.listContainer = options.listContainer;
			else
				throw "listContainer option is required";
			if ('listElementSelector' in options)
				this.listElementSelector = options.listElementSelector;
			else
				throw "listElementSelector option is required";
		}
	}

	#findDropTarget(gesture, ev, extras) {
		let draggedElement = gesture.element();
		let candidates = document.elementsFromPoint(ev.clientX, ev.clientY);
		let listItems = Array.from(this.listContainer.querySelectorAll(this.listElementSelector));
		let dragTargetIndex = listItems.indexOf(draggedElement);
		if (dragTargetIndex == -1) {
		}
		for (let c of candidates) {
			if (c == this.listContainer) {
				console.log("dropTarget not found");
				return null;
			}
			if (c == draggedElement)
				continue;
			if (listItems.indexOf(c) != -1)
				return c;
		}
		return null;
	}

	clear(animate, extras) {
	}

	idleStart() {}

	waitStart() {}

	activeStart(gesture, ev, extras) {}

	moved(gesture, ev, extras) {
		let newTarget = this.#findDropTarget(gesture, ev, extras);
		if (newTarget)
			console.log("Found target", newTarget);
	}

	completed(gesture, ev, extras) {
	}
	cancelled(gesture, ev, extras) {
		this.clear(false, extras);
	}
}
