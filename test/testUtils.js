var loggerOptions = {
  idleStart: (gesture) => {
    console.log("idleStart", gesture.name());
  },
  waitStart: (gesture, ev) => {
    console.log("waitStart", gesture.name(), ev.type);
  },
  activeStart: (gesture, ev) => {
    console.log("activeStart", gesture.name(), ev.type);
  },
  moved: (gesture, ev, state, delta) => {
    console.log("moved", gesture.name(), ev.type, state, delta);
  },
  completed: (gesture, ev) => {
    console.log("completed", gesture.name(), ev.type);
  },
  cancelled: (gesture, ev) => {
    console.log("cancelled", gesture.name(), ev.type);
  }
};

/**
 * GestureLogger - custom element that 
 */
class GestureLogger extends HTMLElement {

  connectedCallback() {
    this.innerText = "GestureLogger";
    let me = this;
    this.gestureOptions = {
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
      }
    }
  }
}
customElements.define("gesture-logger", GestureLogger);
let style = document.createElement("style");
style.setAttribute("id", "able-gesture-testUtils.js");
style.innerText = `
gesture-logger {
  font-family:monospace;
  font-size: 10px;
  display:block;
}
gesture-logger[data-gesture-state=idle] {
  background-color:#ffeaea;
}
gesture-logger[data-gesture-state=waiting] {
  background-color:#fbff4e;
}
gesture-logger[data-gesture-state=active] {
  background-color:#bdebd3;
}`;
document.querySelector("head").prepend(style);

