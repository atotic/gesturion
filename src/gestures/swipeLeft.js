/**
 * SwipeLeft gesture.
 * 
 * handle multitouch swipes?
 */
import GestureHandler from "./gestureHandler.js"

export default class SwipeLeft extends GestureHandler {
  #myEventSpecs = new Map([
    ['idle', ['pointerdown']],
    ['waiting', ['pointermove', 'pointerleave', 'pointercancel', 'pointerup']],
    ['active', ['pointermove', 'pointerleave', 'pointercancel', 'pointerup']]
  ]);

  threshold = 3; // travel at least this much before activation
  pageStart = { x: -1, y: -1}
  /**
   * @param {Object} options 
   * @param {number} options.threshold - how far left in pixels to move before swipe activates
   * @param {*} options.* - see GestureHandler.constructor options
   */
  constructor(element, options) {
    // Options: callbacks for start, move, cancel, complete, threshold
    super(element, options);
    if ('threshold' in options)
      this.threshold = parseInt(options.threshold);
  }

  name() {
    return "SwipeLeft";
  }

  eventSpecs(state) {
    return this.#myEventSpecs.get(state);
  }

  handleIdleEvent(ev) {
    if (ev.type == 'pointerdown') {
      this.pageStart = { x: ev.pageX, y: ev.pageY };
      if (this.threshold <= 0) {
        this.makePartialCallback("activeStart", this, ev);
        return "active";
      }
      this.makePartialCallback("waitStart",this, ev);
      return 'waiting';
    }
    console.warn("Unexpected idle event", ev.type);
  }
  
  handleWaitEvent(ev) {
    if (ev.type == 'pointermove') {
      let delta = this.pageStart.x - ev.pageX;
      if (this.options.moved)
        this.options.moved( this, ev,this.getState(), delta);
      if (delta > this.threshold) {
        this.makePartialCallback("activeStart", this, ev);
        return 'active';
      }
      return;
    }
    if (ev.type == 'pointerleave' || ev.type == 'pointercancel' || ev.type == 'pointerup') {
      if (this.options.cancelled)
        this.options.cancelled(this, ev);
      return "idle";
    }
    console.warn("Unexpected wait event", ev.type);
  }

  handleActiveEvent(ev) {
    if (ev.type == 'pointerup') {
      if (this.options.completed)
        this.options.completed(this, ev);
      return "idle";
    }
    if (ev.type == 'pointermove') {
      if (this.options.moved) 
        this.options.moved(this, ev, this.getState(), this.pageStart.x - ev.pageX);
      return;
    }
    if (ev.type == 'pointercancel' || ev.type == 'pointerleave') {
      if (this.options.cancelled)
        this.options.cancelled(this, ev);
      return "idle";
    }
    console.warn("unexpected active event", ev.type);
  }
}