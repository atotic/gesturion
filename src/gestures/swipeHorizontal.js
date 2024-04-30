/**
 * SwipeLeft gesture.
 * 
 * handle multitouch swipes?
 */
import GestureHandler from "./gestureHandler.js"

export default class SwipeHorizontal extends GestureHandler {
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
  direction = "ltr"; // swipe direction

  pageStart = { x: -1, y: -1}
  lastPointer = { // used to compute pointer speed
    x: -1, 
    timeStamp: 0, 
    speed: 0  // last computed speed, pixels/100ms. More than 4 seems fast
  }

  /**
   * @param {Object} options 
   * @param {number} options.threshold - how far to move before swipe activates
   * @param {string} options.direction - "ltr"|"rtl" (like css direction)
   * @param {*} options.* - see GestureHandler.constructor options
   */
  constructor(element, options) {
    // Options: callbacks for start, move, cancel, complete, threshold
    super(element, options);
    if ('threshold' in options)
      this.threshold = parseInt(options.threshold);
    if ('direction' in options) {
      if (['ltr', 'rtl'].indexOf(options.direction) == -1)
        throw `Invalid options.direction "${options.direction}"`;
      this.direction = options.direction;
    }
  }

  #updateSpeed(ev) {
    let speed = null;
    if (this.lastPointer.x != -1) {
      let timeDelta = ev.timeStamp - this.lastPointer.timeStamp;
      if (timeDelta < 1)
        timeDelta = 1;
      let xDelta = ev.pageX - this.lastPointer.x;
      speed = xDelta/timeDelta * 100;
    }
    this.lastPointer = {
      x: ev.pageX, timeStamp: ev.timeStamp, speed: speed
    }
    return speed;
  }
  name() {
    return "SwipeHorizontal";
  }

  eventSpecs(state) {
    return this.#myEventSpecs.get(state);
  }

  handleIdleEvent(ev) {
    if (ev.type == 'pointerdown') {
      this.pageStart = { x: ev.pageX, y: ev.pageY };
      this.lastX = ev.pageX;
      this.#updateSpeed(ev);
      if (this.threshold == 0 || this.options.effect.hasVisibleEffect())
        return "active";
      return 'waiting';
    }
    console.warn("Unexpected idle event", ev.type);
  }
  
  #aboveThreshold(delta) {
    if (this.direction == 'ltr')
      return delta >= this.threshold;
    // direction == 'rtl'
    return delta <= -this.threshold;
  }
  handleWaitEvent(ev) {
    if (ev.type == 'pointermove') {
      let delta = ev.pageX - this.pageStart.x;
      this.options.effect.moved( this, ev,this.getState(), delta, this.#updateSpeed(ev));
      if (this.#aboveThreshold(delta))
        return 'active';
      return;
    }
    if (ev.type == 'pointerleave' || ev.type == 'pointercancel' || ev.type == 'pointerup') {
      this.options.effect.cancelled(this, ev);
      return "idle";
    }
    console.warn("Unexpected wait event", ev.type);
  }

  handleActiveEvent(ev) {
    if (ev.type == 'pointerup') {
      this.options.effect.completed(this, ev, this.lastPointer.speed);
      return "idle";
    }
    if (ev.type == 'pointermove') {
      this.#updateSpeed(ev);
      if (this.options.effect.moved)
       this.options.effect.moved(this, ev, this.getState(), ev.pageX - this.pageStart.x);
      return;
    }
    if (ev.type == 'pointercancel' || ev.type == 'pointerleave') {
      if (this.options.effect.cancelled)
        this.options.effect.cancelled(this, ev);
      return "idle";
    }
    console.warn("unexpected active event", ev.type);
  }
}