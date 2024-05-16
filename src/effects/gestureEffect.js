/** 
 * GestureEffect
 * 
 * All GestureHandlers take GestureEffect as an option.
 * GestureEffect can be used to implement visual gesture feedback.
 */

import EffectCleaner from "./effectCleaner.js";

export default class GestureEffect {
  // Default animation time for effects (ms)
  static ANIM_TIME = 300;
  static flickSpeed = 4;  // pixels/100ms; movement faster than this is considered a "flick"
  static EffectCleaner = EffectCleaner;
  
  constructor() {
    // Not a great place for this initializer.
    if (GestureEffect.EffectCleaner && GestureEffect.EffectCleaner.init)
      GestureEffect.EffectCleaner.init();
  }
  // Effects can set gesture's defaults. 
  gestureOptionOverrides() { return {};}

  clear(animate) {
    console.warn("clear not handled");
  }
  // Any elements created by this gesture
  element() {
    console.warn("element not handled");
  }
  // Return true if gesture should be activated immediately 
  // on wait. Useful if effect is already displayed,
  // and you do not want to miss events.
  hasVisibleEffect() {
    return this.element() != null;
  }

  idleStart(gesture)  {
    console.warn("idleStart not handled");
  }
  waitStart (gesture, ev) {
    console.warn("waitStart not handled");
  }
  activeStart (gesture, ev) {
    console.warn("activeStart not handled");
  }
  moved(gesture, ev, state, delta) {
    console.warn("moved not handled");
  }
  completed(gesture, ev) {
    console.warn("completed not handled");
  }
  cancelled(gesture, ev) {
    console.warn("cancelled not handled");
  }
};
