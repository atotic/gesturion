/** 
 * DropListItemEffect 
 * 
 * Implements 'drop' dropping part of dragging the list item.
 * 
 * Moves other items out of the way, and moves item in DOM
 * on completion.
 * 
 */

import GestureEffect from "./gestureEffect.js";
// import appendStyleRule from "../gestureStyles.js"

function defaultDrop(dragSource, sourceIndex, targetIndex) {
	// console.log("Dropped", dragSource, sourceIndex, targetIndex);
}

export default class MoveListItemEffect extends GestureEffect {

	finalDropTargetIndex = -1;
	// Options
	dropCallback = defaultDrop;
	listContainer = null;	// Element that contains all the list items.
	listElementSelector = ""; // CSS selector for list items. listContainer.querySelector(listElementSelector) shoudl return all list items.
	direction = "vertical";

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
			if ('direction' in options) {
				if (['horizontal', 'vertical'].indexOf(options.direction) == -1)
					throw `Illegal direction option ${options.direction}`;
				this.direction = options.direction;
			}
		}
	}

	name() {
		return "MoveListItemEffect";
	}

	#moveOutOfTheWay(dragSource, ev) {
		// Figuring out what to move where is complicated because
		// dropTarget might have already been moved, so its location
		// does not match its position in the list.
		// To find out where to open up the empty space,
		// reset all transforms, and what item is underneath the pointer
		this.finalDropTargetIndex  = -1;
		let allItems = this.#allListItems();
		for (let el of allItems) {
			if (el != dragSource)
				el.style.transform = "";
		}
		let dropTarget = this.#findDropTarget(dragSource, ev);
		if (dropTarget == null)	{// Everything has already moved
			this.finalDropTargetIndex = -1;
			return;	
		}
		let dropTargetIndex = allItems.indexOf(dropTarget);
		let dragSourceIndex = allItems.indexOf(dragSource);

		let dragSourceSize = this.direction == "vertical" ? dragSource.offsetHeight : dragSource.offsetWidth;

		let start, end;
		let transform = this.direction == "vertical" ? "translateY(" : "translateX(";
		if (dragSourceIndex < dropTargetIndex) {
			start = dragSourceIndex;
			end = dropTargetIndex;
			transform += `-${dragSourceSize}px)`;
		} else {
			start = dropTargetIndex;
			end = dragSourceIndex;
			transform += `${dragSourceSize}px)`;
		}
		for (let i=0; i<allItems.length; i++) {
			if (i == dragSourceIndex)
				continue;
			if (i >= start && i <= end) {
				allItems[i].style.transform = transform;
			} else {
				allItems[i].style = "";
			}
		}
		this.finalDropTargetIndex = dropTargetIndex;
	}

	#allListItems() {
		return Array.from(this.listContainer.querySelectorAll(this.listElementSelector));
	}

	#findDropTarget(dragSource, ev) {
		let candidates = document.elementsFromPoint(ev.clientX, ev.clientY);
		let listItems = this.#allListItems();
		let dragSourceIndex = listItems.indexOf(dragSource);
		if (dragSourceIndex == -1) {
			console.error("Dragged target not found inside the list");
			return;
		}
		for (let c of candidates) {
			if (c == this.listContainer) {
				// console.log("dropTarget not found");
				return;
			}
			if (c == dragSource)
				continue;
			if (c == this.listContainer)
				return;
			let cIndex = listItems.indexOf(c);
			if (cIndex != -1) {
				return c;
			}
		}
		return;
	}

	clear(animate, extras) {
		this.finalDropTargetIndex  = -1;
		for (let el of this.#allListItems())
			el.style.transform ="";
	}

	idleStart() {}

	waitStart() {}

	activeStart(gesture, ev, extras) {}

	moved(gesture, ev, extras) {
		if (this.#findDropTarget(gesture.element(), ev)) {
			this.#moveOutOfTheWay(gesture.element(), ev);
		}
	}

	completed(gesture, ev, extras) {
		if (this.finalDropTargetIndex != -1) {
			let listItems = this.#allListItems();
			let dragSource = gesture.element();
			let dragSourceIndex = listItems.indexOf(dragSource);
			if (dragSourceIndex == -1)
				throw "Could not find drag source!";
			let finalIndex = this.finalDropTargetIndex;
			if (this.finalDropTargetIndex == listItems.length)
				this.listContainer.append(dragSource);
			else {
				if (dragSourceIndex < this.finalDropTargetIndex)
					finalIndex += 1;
				this.listContainer.insertBefore(dragSource, listItems[finalIndex]);
			}
			if (this.dropCallback)
				this.dropCallback(dragSource, dragSourceIndex, this.finalDropTargetIndex);
		}
		this.clear();
	}

	cancelled(gesture, ev, extras) {
		this.clear(false, extras);
	}
}
