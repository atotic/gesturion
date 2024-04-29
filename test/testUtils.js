import GestureEffect from "../src/effects/gestureEffect.js";
import appendStyleRule from "../src/gestureStyles.js"

// LoggerEffect logs effect callbacks
class LoggerEffect  extends GestureEffect {
  forwardTo;  // forward callbacks to this effect
  constructor(forwardTo) {
    super();
    this.forwardTo = forwardTo;
  }
  clear(animate) {
    if (this.forwardTo)
      return this.forwardTo.clear(animate);
    console.error("clear is now part of the callback API?")
  }
  element() {
    console.log("element");
    if (this.forwardTo)
      return this.forwardTo.element();
  }
  hasVisibleEffect() {
    if (this.forwardTo)
      return this.forwardTo.hasVisibleEffect();
    return false;
  }
  idleStart(gesture)  {
    console.log("idleStart", gesture.name());
    if (this.forwardTo)
      this.forwardTo.idleStart(gesture);
  }
  waitStart (gesture, ev) {
    console.log("waitStart", gesture.name(), ev.type);
    if (this.forwardTo)
      this.forwardTo.waitStart(gesture, ev);
  }
  activeStart (gesture, ev) {
    console.log("activeStart", gesture.name(), ev.type);
    if (this.forwardTo)
      this.forwardTo.activeStart(gesture, ev);
  }
  moved(gesture, ev, state, ...rest) {
    console.log("moved", gesture.name(), ev.type, state /*delta*/);
    if (this.forwardTo)
      this.forwardTo.moved(gesture, ev, state, ...rest);
  }
  completed(gesture, ev, ...rest) {
    console.log("completed", gesture.name(), ev.type);
    if (this.forwardTo)
      this.forwardTo.completed(gesture, ev, ...rest);
  }
  cancelled(gesture, ev) {
    console.log("cancelled", gesture.name(), ev.type);
    if (this.forwardTo)
      this.forwardTo.cancelled(gesture, ev);
  }
};

/**
 * GestureLogger - custom element that displays/logs effect callbacks
 */
class GestureLogger extends HTMLElement {

  connectedCallback() {
    this.innerText = "GestureLogger";
    let me = this;
    this.gestureEffect = {
      idleStart: (gesture) => {
        console.log("idleStart", gesture.name());
        me.setAttribute("data-gesture-state", "idle");
        me.innerHTML = `
          <span>idleStart</span> 
          <span>${gesture.name()}</span>`;
      },
      waitStart: (gesture, ev) => {
        console.log("waitStart", gesture.name(), ev.type);
        me.setAttribute("data-gesture-state", "waiting");
        me.innerHTML = `
        <span>waitStart</span> 
        <span>${gesture.name()}</span>
        <span>${ev.type}</span>`;
      },
      activeStart: (gesture, ev) => {
        console.log("activeStart", gesture.name(), ev.type);
        me.setAttribute("data-gesture-state", "active");
        me.innerHTML = `
        <span>activeStart</span> 
        <span>${gesture.name()}</span>
        <span>${ev.type}</span>`;
      },
      moved: (gesture, ev, state, delta) => {
        me.innerHTML = `
        <span>moved</span> 
        <span>${gesture.name()}</span>
        <span>${ev.type}</span>
        <span>${state}</span>
        <span>${delta.toFixed(1)}</span>`;
      },
      completed: (gesture) => {
        me.innerHTML = `
        <span>completed</span>
        <span>${gesture.name()}</span>`;
      },
      cancelled: (gesture) => {
        me.innerHTML = `
        <span>cancelled</span>
        <span>${gesture.name()}</span>`;
      },
      clear: () => {},
      hasVisibleEffect: () => { return false; }
    }
  }
}
customElements.define("gesture-logger", GestureLogger);

function createEvent(type, element, location) {
  let elRect = element.getBoundingClientRect();

  let pageX = elRect.x;
  let pageY = elRect.y;
  if (location) {
    if (location.x)
      pageX += location.x;
    if (location.y)
      pageY += location.y;
    if (location.left)
      pageX += location.left;
    if (location.right)
      pageX += elRect.width - location.right;
  }
  let ev = new PointerEvent(type, {
    bubbles: true, 
    timeStamp: 5,
    clientX: pageX - window.scrollX, 
    clientY: pageY - window.scrollY
  });
  return ev;
}

async function awaitTimeout(timeout=200) {
  return new Promise((resolve, reject) => {
    window.setTimeout( _ => resolve(), timeout);
  });
}

async function awaitSizeStopAnimating(el, timeout=1000) {
  if (el == null)
    return Promise.reject("NULL el passed to awaitSizeStopAnimating");
  let lastWidth;
  let lastHeight;
  let endMillis = Date.now() + timeout;
  return new Promise((resolve, reject) => {
    let interval = window.setInterval( () => {
      if (el.offsetWidth == lastWidth && el.offsetHeight == lastHeight) {
        window.clearInterval(interval);
        resolve();
      }
      if (Date.now() > endMillis) {
        window.clearInterval(interval);
        reject("awaitSizeStopAnimating timed out after " + timeout + "ms");
      }
      lastWidth = el.offsetWidth;
      lastHeight = el.offsetHeight;
    }, 20);
  });
}

export {LoggerEffect, GestureLogger, createEvent, awaitTimeout, awaitSizeStopAnimating}

appendStyleRule("gesture-logger",`
  font-family:monospace;
  font-size: 10px;
  display:block;
`);
appendStyleRule("gesture-logger[data-gesture-state=idle]",`
  background-color:#ffeaea;`);
appendStyleRule("gesture-logger[data-gesture-state=waiting]",`
  background-color:#fbff4e;`);
appendStyleRule("gesture-logger[data-gesture-state=active]",`
  background-color:#bdebd3;`);
