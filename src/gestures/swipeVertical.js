/**
 * SwipeVertical gesture
 * 
 * Detects horizontal swipes.
 * Handles scrolling correctly.
 * 
 * completedExtras, moveExtras  {
 *   delta: // how far Y has the pointer moved from start point
 *   speed: // how fast, px/100ms
 * }
 * 
 * Configuration options
 * threshold=3 {pixels} - how far to move before swipe activates. Surprisingly,
 *                        setting it to 0 does not seem to help with preventing scroll.
 * direction=both {dtu|utd|both}- restrict movement to
 *    down to up|up to down|allow both
 * scrollBoundaryOnly - if true, activate only when scrolling is no longer possible 
 *                      element has been scrolled all the way up or all the way down
 * 
 * Demo effects:
 * effects/pullToRefreshEffect.js
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
    direction = "both"; // utd|dtu|both swiping upToDown, downToUp, or both?
    waitForScrollBoundary = false;

    pageStart = { 
      x: -1, 
      y: -1
    }
    lastPointer = { // used to compute pointer speed
      y: -1, 
      timeStamp: 0, 
      speed: 0
    }

    constructor(element, options) {
      super(element, options);
      if ('effect' in options)
        options = {...options, ...options.effect.gestureOptionOverrides()};
      if ('threshold' in options)
        this.threshold = parseInt(options.threshold);
      if ('direction' in options) {
        if (['utd', 'dtu', 'both'].indexOf(options.direction) == -1)
          throw `Invalid options.direction "${options.direction}"`;
        this.direction = options.direction;
      }
      if ('waitForScrollBoundary' in options) {
        this.waitForScrollBoundary = options.waitForScrollBoundary;
      }
    }

    // true if element should wait to be fully scrolled
    #waitForScrollBoundary() {
      if (!this.waitForScrollBoundary)
        return false;
      let el = this.element();
      if (el.scrollHeight == el.clientHeight)
        return false;
      switch(this.direction) {
      case 'both':
        return false;
      case 'utd':
        return el.scrollTop != 0; // scrolled to the top
      case 'dtu':
        return el.clientHeight + el.scrollTop < el.scrollHeight;
      default:
        console.warn("Unknown swipeVertical direction ", this.direction);
        return false;
      }
    }

    #computeExtras(ev) {
      let speed = null;
      if (this.lastPointer.y != -1) {
        let timeDelta = Math.max(ev.timeStamp - this.lastPointer.timeStamp, 1);
        if (ev.type != 'pointerup')
          speed = (ev.pageY - this.lastPointer.y) * 100 / timeDelta;
        else
          speed = this.lastPointer.speed; // Pointerup does not compute new speed
      }
      if (GestureHandler.TEST_DEFAULT_SPEED)
        speed = GestureHandler.TEST_DEFAULT_SPEED;
      this.lastPointer = {
        y: ev.pageY, 
        timeStamp: ev.timeStamp,
        speed: speed
      }
      // console.log(speed, ev.pageY - this.pageStart.y);
      return {
        speed: speed,
        delta: ev.pageY - this.pageStart.y
      }
    }

    name() {
      return "SwipeV";
    }

    eventSpecs(state) {
      return this.#myEventSpecs.get(state);
    }

    handleIdleEvent(ev) {
      if (this.#waitForScrollBoundary())
        return;
      if (ev.type == 'pointerdown') {
        this.pageStart = { x: ev.pageX, y: ev.pageY };
        this.lastPointer =  { y: -1,  timeStamp: 0, speed: 0};
        if (this.threshold == 0 || this.options.effect.hasVisibleEffect()) {
          // activate immediately if no threshold
          return "active";
        }
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
        let moveExtras = this.#computeExtras(ev);
        this.options.effect.moved( this, ev, this.getState(), moveExtras);
        if (this.#aboveThreshold(moveExtras.delta))
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
        this.options.effect.completed(this, ev, this.#computeExtras(ev));
        return "idle";
      }
      if (ev.type == 'pointermove') {
        this.options.effect.moved(this, ev, this.getState(), this.#computeExtras(ev));
        return;
      }
      if (ev.type == 'pointercancel' || ev.type == 'pointerleave') {
        this.options.effect.cancelled(this, ev);
        return "idle";
      }
      console.warn("unexpected active event", ev.type);
    }
  }
