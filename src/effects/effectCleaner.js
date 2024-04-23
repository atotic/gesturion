/**
 * GlobalEffectCleanup
 * 
 * Utility class for "Effect cleanup" problem.
 * 
 * What is "Effect cleanup problem"?
 * 
 * An effect generate DOM that does not go away when gesture
 * completes, but should go away when another gesture starts.
 * 
 * Example:
 * import GlobalEffectClear from "./globalEffectClear.js";
 * 
 * class myEffect 
 *   activeStart(gesture, ev) {
 *     if (this.myMenu == null) {
 *        this.myMenu = createElement(div)
 *        GlobalEffects
 *     }
 *   }
 */

import gestureManager from "../gestureManager.js";

const cleanupDataMarker = "data-effect-cleanup-mark";
const cleanupSym = Symbol("EffectCleanerSymbol");

class EffectCleaner {
  register(element, effect) {
    element.setAttribute(cleanupDataMarker, 1);
    element[cleanupSym] = effect;
  }
  unregisteer(element) {
    element.removeAttribute(cleanupDataMarker);
    delete element[cleanupSym];
  }
  // safeElements do not get cleaned up.
  cleanup(excludeGestures) {
    let excludeElements = [];
    if (excludeGestures) {
      if (!Array.isArray(excludeGestures))
        excludeElements.push(excludeGestures.effectElement());
      else {
        for (let g of excludeGestures)
          excludeElements.push(g.effectElement())
      } 
    }

    for (let el of document.querySelectorAll(`[${cleanupDataMarker}]`)) {
      if (!el[cleanupSym]) {
        console.warn(`No effect on ${cleanupDataMarker} element`, el);
        continue;
      }
      if (excludeElements.indexOf(el) == -1)
        el[cleanupSym].clear(true);
    }
  }
}

let singleton = new EffectCleaner();

gestureManager.addEventListener(gestureManager.ACTIVE_GESTURE_EVENT, ev => {
  singleton.cleanup(ev.detail);
});

// document.body.addEventListener('click', ev => {
//   singleton.cleanup(gestureManager.activeGestures());
//   console.log("click");
// });

export default singleton;
