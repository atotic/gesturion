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

export {LoggerEffect, GestureLogger}

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
