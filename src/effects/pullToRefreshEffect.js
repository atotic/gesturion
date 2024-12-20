/** 
 * PullToRefresh 
 * 
 * Reveals a panel with a spinner on top-to-bottom swipe.
 * Panel can be fully custom.
 * 
 * Use SwipeVertical gesture.
 */
import GestureEffect from "./gestureEffect.js";

// Default spinner panel builder
function defaultPanelBuilder(effect, container) {
  let panel = document.createElement('div');
  panel.classList.add("defaultPullDownSpinner");
  panel.setAttribute("style", "height:100px;background-color:rgba(253, 255, 226, 0.8);overflow:hidden;");
  let spinner = document.createElement('div');
  spinner.setAttribute("style", "margin-left:45%;margin-top:24px;font-size:36px;width:1em;height:1em;line-height:1em" );
  spinner.textContent = "🌼";
  spinner.animate([
    {transform:"rotate(360deg)"}
  ], {duration: 2000, iterations: Infinity});
  panel.appendChild(spinner);
  panel.pullToRefreshEffect = effect;
  return panel;
}

export default class PullToRefreshEffect extends GestureEffect {
  panel;  // Pane being displayed
  // Gesture state. We have to keep track, because timeout 
  // callback does not have access to gesture object.
  state; 

  hideTimeoutId; 

  // Options:
  container;  // container where panel will be added to the top
  activateCallback; // called when spinner is fully revealed.
  hideTimeout = 1000; // automatically hide after timeout
  panelBuilder = defaultPanelBuilder;
  panelBuilderOptions;
  
  constructor(options) {
    super(options);
    if (!options.container)
      throw "PullToRefreshEffect options.container not set";
    this.container = options.container;
    for (let p of ['panelBuilder', 'panelBuilderOptions', 'hideTimeout', 'activateCallback']) {
      if (p in options)
        this[p] = options[p];
    }
  }

  name() {
    return "PullToRefresh";
  }

  gestureOptionOverrides() { 
    return {direction:'utd', waitForScrollBoundary: true };
  }

  animatePanelToHeight(finalHeight, duration=GestureEffect.ANIM_TIME) {
    // console.log("animate", finalHeight, duration, rthis.panel.offsetHeight);
    if (!this.panel) {
      console.error("No panel to animate!");
      return;
    }
    let animOptions = {
      duration: duration,
      easing: 'ease-out'
    };
    for (let a of this.panel.getAnimations()) {
      // console.log("cancelling animations!");
      a.cancel();
    }
    let animation = this.panel.animate([
      {height: `${this.panel.offsetHeight}px`},
      {height: `${finalHeight}px`}
    ], animOptions);
    animation.finished.finally( _ => {
      if (this.panel)
        this.panel.style.height = `${finalHeight}px`;
    }).catch( err => {
      // console.log("Animation cancelled");
      // error gets thrown if animation is cancelled
    });
    return animation;
  }

  timeLeftTillCloseTestingOnly() {
    if (this.hideTimeoutStopTime) {
      let timeLeft = this.hideTimeoutStopTime - Date.now();
      return (timeLeft / 100).toFixed(0);  
    }
    return null;
  }

  startHideTimeout() {
    if (this.hideTimeoutId) {
      window.clearTimeout(this.hideTimeoutId);
      delete this.hideTimeoutId;
    }
    if (!this.boundTimeoutCallback)
      this.boundTimeoutCallback = this.timeoutCallback.bind(this);
    this.hideTimeoutId = window.setTimeout(this.boundTimeoutCallback, this.hideTimeout);
    this.hideTimeoutStopTime = Date.now() + this.hideTimeout;
  }

  timeoutCallback() {
    delete this.hideTimeoutId;
    delete this.hideTimeoutStopTime;
    // Hide if not in the middle of the gesture
    if (this.state != 'active')
      this.clear(true);
    else
      this.startHideTimeout();
  }
  
  // GestureEffect overrides

  clear(animate) {
    if (this.hideTimeoutId) {
      window.clearTimeout(this.hideTimeoutId);
      delete this.hideTimeoutId;
      delete this.hideTimeoutStopTime;
    }

    if (this.panel) {
      let cleanup = () => {
        if (!this.panel)
          return;
        this.panel.remove();
        delete this.panel;
        delete this.initialHeight;
      }
      if (animate) {
        this.animatePanelToHeight(0).finished
          .then( () => cleanup() )
          .catch( () => { /* no cleanup on abort, means new gesture has started */} )
      } else {
        cleanup();
      }
    }
  }

  hasVisibleEffect() {
    return this.panel != null;
  }

  element() {
    return this.panel;
  }

  idleStart() {
    this.state = "idle";
    // console.log("idle");
  }

  waitStart() {
    this.state = "waiting";
    // console.log("waiting");
  }

  activeStart(gesture, ev) {
    // console.log("active");
    this.state = "active";
    if (!this.panel) {
      this.panel = this.panelBuilder(this, this.container);
      this.container.prepend(this.panel);
      this.initialHeight = 0;
      this.defaultHeight = this.panel.offsetHeight;
      this.animatePanelToHeight(0,0);
    } else {
      this.initialHeight = this.panel.offsetHeight;
    }
    this.startHideTimeout();
  }

  moved(gesture, ev, extras) {
    if (gesture.getState() != 'active' || !this.panel)
      return;
    let newHeight = Math.max(0, this.initialHeight + extras.delta / 2);
    // console.log("moved", extras.delta, newHeight);
    this.animatePanelToHeight(newHeight, 0);
  }
  
  completed(gesture, ev, extras) {
    this.state = "idle";
    // console.log("spin completed", ev.type);    
    let flickDown = extras.speed > GestureEffect.flickSpeed;
    let dismiss = !this.panel;
    // dismiss if short, and not flicked down
    dismiss ||= (this.panel.offsetHeight < this.defaultHeight / 2) && !flickDown;
    dismiss ||= extras.speed < -GestureEffect.flickSpeed;
    if (dismiss) {
      this.clear(true);
    } else {
      this.startHideTimeout();
      this.animatePanelToHeight(this.defaultHeight);
      if (this.activateCallback)
        this.activateCallback(this);
    }
  }

  cancelled(gesture, ev) {
    this.state = "idle";
    // console.log("spin cancelled", ev.type);
    // No panel
    if (!this.panel) {
      this.clear();
      return;
    }
    // Hide immediately if less than half open
    let dismiss = !this.panel || this.panel.offsetHeight < this.defaultHeight / 2;
    if (dismiss) {
      this.clear(true);
    } else {
      this.startHideTimeout();
      this.animatePanelToHeight(this.defaultHeight);
    }
  }
}
