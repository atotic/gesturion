/**
 * SwipeLeft gesture.
 * 
 * handle multitouch swipes?
 */
import GestureHandler from "./gestureHandler.js"

export default class SwipeLeft extends GestureHandler {
  #myEventSpecs = new Map([
    ['idle', ['pointerdown']],
    ['waiting', [
      { eventType: 'pointermove', element: 'body' },
      { eventType: 'pointerleave', element: 'body' },
      { eventType: 'pointercancel', element: 'body' },
      { eventType: 'pointerup', element: 'body' }
      ]
    ],
    ['active', [
      { eventType: 'pointermove', element: 'body' },
      { eventType: 'pointerleave', element: 'body' },
      { eventType: 'pointercancel', element: 'body' },
      { eventType: 'pointerup', element: 'body' }
      ]
    ]]);

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
      if (this.threshold <= 0)
        return "active";
      return 'waiting';
    }
    console.warn("Unexpected idle event", ev.type);
  }
  
  handleWaitEvent(ev) {
    if (this.options.effects.instantActiveOnWait()) {
      return 'active';
    }
    if (ev.type == 'pointermove') {
      let delta = this.pageStart.x - ev.pageX;
      this.options.effects.moved( this, ev,this.getState(), delta);
      if (delta > this.threshold) {
        return 'active';
      }
      return;
    }
    if (ev.type == 'pointerleave' || ev.type == 'pointercancel' || ev.type == 'pointerup') {
      this.options.effects.cancelled(this, ev);
      return "idle";
    }
    console.warn("Unexpected wait event", ev.type);
  }

  handleActiveEvent(ev) {
    if (ev.type == 'pointerup') {
      this.options.effects.completed(this, ev);
      return "idle";
    }
    if (ev.type == 'pointermove') {
      if (this.options.effects.moved) 
       this.options.effects.moved(this, ev, this.getState(), this.pageStart.x - ev.pageX);
      return;
    }
    if (ev.type == 'pointercancel' || ev.type == 'pointerleave') {
      if (this.options.effects.cancelled)
        this.options.effects.cancelled(this, ev);
      return "idle";
    }
    console.warn("unexpected active event", ev.type);
  }
}