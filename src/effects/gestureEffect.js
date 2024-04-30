/** 
 * GestureEffect
 * 
 * All GestureHandlers take GestureEffect as an option.
 * GestureEffect can be used to implement visual gesture feedback.
 */

export default class GestureEffect {
  // Animation time for effects (ms)
  static ANIM_TIME = 300; 

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
  clear(animate) {
    console.warn("clear not handled");
  }
  element() {
    console.warn("element not handled");
  }
  // Return true if gesture should be activated immediately 
  // on wait. Useful if effect is already displayed,
  // and you do not want to miss events.
  hasVisibleEffect() {
    return this.element() != null;
  }
};
