/**
 * SwipeVertical gesture
 * 
 * Detects horizontal swipes.
 * Reports swipe speed to effect.moved(), effect.completed() 
 * in pixels/100ms. 
 * Deals with scrolling
 * 
 * Configuration options
 * threshold=3 {pixels} - how far to move before swipe activates
 * direction=both {dtu|utd|both}- restrict movement to
 *    down to up|up to down|allow both
 * 
 * Demo effects:
 * 
 */

import GestureHandler from "./gestureHandler.js"

export default class SwipeVertical extends GestureHandler {
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
    direction = "both"; // ltr|rtl|all swiping left,right, or both?
  
    pageStart = { x: -1, y: -1}
    lastPointer = { // used to compute pointer speed
      y: -1, 
      timeStamp: 0, 
      speed: 0  // last computed speed, pixels/100ms. More than 4 seems fast
    }

    constructor(element, options) {
      // Options: callbacks for start, move, cancel, complete, threshold
      super(element, options);
      if ('threshold' in options)
        this.threshold = parseInt(options.threshold);
      if ('direction' in options) {
        if (['utd', 'dtu', 'both'].indexOf(options.direction) == -1)
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
        let yDelta = ev.pageY - this.lastPointer.y;
        speed = yDelta/timeDelta * 100;
      }
      if (GestureHandler.TEST_DEFAULT_SPEED)
        speed = GestureHandler.TEST_DEFAULT_SPEED;
      this.lastPointer = {
        y: ev.pageY, timeStamp: ev.timeStamp, speed: speed
      }
      return speed;
    }
    name() {
      return "SwipeV";
    }
    eventSpecs(state) {
      return this.#myEventSpecs.get(state);
    }
    handleIdleEvent(ev) {
      if (ev.type == 'pointerdown') {
        this.pageStart = { x: ev.pageX, y: ev.pageY };
        this.lastY = ev.pageY;
        this.#updateSpeed(ev);
        if (this.threshold == 0 || this.options.effect.hasVisibleEffect())
          return "active";
        return 'waiting';
      }
      console.warn("Unexpected idle event", ev.type);
    }

    #aboveThreshold(delta) {
      if (this.direction == 'utd')
        return delta >= this.threshold;
      if (this.direction == 'dtu')
        return delta <= -this.threshold;
      // direction == 'both'
      return delta >= this.threshold || delta <= -this.threshold;
    }
    handleWaitEvent(ev) {
      if (ev.type == 'pointermove') {
        let delta = ev.pageY - this.pageStart.y;
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
        this.options.effect.moved(this, ev, this.getState(), ev.pageY - this.pageStart.y);
        return;
      }
      if (ev.type == 'pointercancel' || ev.type == 'pointerleave') {
        this.options.effect.cancelled(this, ev);
        return "idle";
      }
      console.warn("unexpected active event", ev.type);
    }
  }