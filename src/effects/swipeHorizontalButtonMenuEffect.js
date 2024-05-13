/** 
 * SwipeHorizontalButtonMenuEffect 
 * 
 * Button menu that displays when you swipe.
 * Inspired by message button menus in mail apps.
 * It can scroll content as you swipe (looks nice)
 * Can have a default button that fires on full swipe.
 * Menu can stay open until user clicks somewhere else.
 * 
 * Options:
 * direction {ltr|rtl} - menu side, left or right
 * container {Element} - containing element for the menu.
 *    Must be "absolute positioning containing block" (ex: position:relative)
 * contentSelector {string}
 *    CSS selector for content that should scroll as menu is revealed.
 *    If empty, content will not scroll
 * menuBuilder {function(effect, container, menuBuilderOptions)}
 *    Function that creates the menu element
 * menuBuilderOptions - options passed to menu builder
 * 
 */
import appendStyleRule from "../gestureStyles.js"
import GestureEffect from "./gestureEffect.js";

let POSITION_RELATIVE_CLASS="swipePositionRelative";

export default class SwipeHorizontalButtonMenuEffect extends GestureEffect {

  menu; // Menu being displayed.
  defaultButton;  // Default button, if specified as data-gesture-default
  defaultModeOn; // True if default mode is active
  hasMoved; // True if pointer has moved since activated
  dismissOnPointerUp; // If user clicks outside of the already open menu, menu should be dismissed

  // Options:
  // Menu container. Needs to be an "absolute positioning containing block"
  // https://drafts.csswg.org/css-position/#ref-for-absolute-positioning-containing-block%E2%91%A0
  container;
  // CSS selector for content that should scroll as menu is revealed.
  // If empty, content will not scroll
  contentSelector;
  menuBuilder;  // Callback fn(effect, container, menuBuilderOptions)
  menuBuilderOptions;
  direction = "ltr";  // 'ltr'|'rtl'

  constructor(options) {
    super(options);
    for (let p of ['container', 'menuBuilder'])
      if (!p in options)
        throw `${p} must not be null`;
    this.container = options.container;
    this.contentSelector = options.contentSelector;
    this.menuBuilder = options.menuBuilder;
    this.menuBuilderOptions = options.menuBuilderOptions;
    if ('direction' in options) {
      if (["ltr", "rtl"].indexOf(options.direction) == -1)
        throw `Invalid options.direction "${options.direction}"`;
      this.direction = options.direction;
    }
  }
  contentElement() {
    if (this.contentSelector)
      return this.container.querySelector(this.contentSelector);
    return null;
  }
  animateMenuToWidth(finalWidth, duration=GestureEffect.ANIM_TIME) {
    finalWidth = finalWidth.toFixed();
    // console.log("animateMenuToWidth", finalWidth);
    let animOptions = {
      duration: duration,
      easing: 'ease-out'
    };
    // Animate menu
    let menuAnimation = this.menu.animate(
      [
        {width: `${this.menu.offsetWidth}px`},
        {width: `${finalWidth}px`}
      ], animOptions);
    menuAnimation.finished.then( _ => {
      if (this.menu)
        this.menu.style.width = `${finalWidth}px`;
    });
    // Animate content
    let content = this.contentElement();
    if (content) {
      content.classList.add(POSITION_RELATIVE_CLASS);
      let sign = this.direction == "ltr" ? "" : "-";
      let animation = [ 
        { left: `${content.offsetLeft}px`},
        { left: `${sign}${finalWidth}px`}
      ];
      content.animate(
        animation, animOptions).finished.then( _ => {
          content.style.left = `${sign}${finalWidth}px`;
        });
    } else {
      console.warn("no content");
    }
    return menuAnimation;
  }

  setDefaultMode(defaultOn) {
    if (defaultOn == this.defaultModeOn)
      return;
    // Default button mode, hide other buttons
    let animOptions = {
      duration: GestureEffect.ANIM_TIME,
      easing: 'ease-out'
    }
    for (let item of this.menu.querySelectorAll(".swipeHorizontalMenuItem")) {
      if (defaultOn) {
        if (item == this.defaultButton)
          continue;
        // Non-default items shrink to 0
        let scopeItem = item;
        let itemWidth = item.offsetWidth;
        item.style.flexBasis = 'auto';
        item.style.flexGrow = '0';
        item.style.flexShrink = '0';
        item.animate(
          [
            {width: `${itemWidth}px`},
            {width: "0"}
          ], animOptions
        ).finished.then( _ => {
          scopeItem.style.flexBasis = '';
          scopeItem.style.flexGrow = '';
          scopeItem.style.flexShrink = '';
          scopeItem.style.display = "none";
        });
        // Most native apps vibrate for default selection
        if (navigator.vibrate)
          navigator.vibrate(100);
      } else {
        item.style.display = "";
      }
    }
    this.defaultModeOn = defaultOn;
  } 

  // GestureEffect overrides
  clear(animate) {
    if (this.menu) {
      let cleanup = () => {
        if (!this.menu)
          return;
        this.menu.remove();
        delete this.menu;
        delete this.defaultButton;
        delete this.defaultModeOn;
        this.hasMoved = false;
        this.dismissOnPointerUp = false;
        let content = this.contentElement();
        if (content) {
          content.classList.remove(POSITION_RELATIVE_CLASS);
          content.style.left = "";
        }       
      }
      if (animate) {
        this.animateMenuToWidth(0)
        .finished.then( _ => {
          cleanup();
        });
      } else
        cleanup();
    }   
  }
  hasVisibleEffect() {
    return this.menu != null;
  }
  element() {
    return this.menu;
  }
  idleStart (){
    this.hasMoved = false;
    this.dismissOnPointerUp = false;
  }
  waitStart (){}
  activeStart(gesture, ev) {
    if (this.menu) {  // parentNode checks if menu is still in DOM
      // user has clicked on container with alredy expanded menu

      if (!this.menu.parentNode)
        console.error("buttonMenu deleted without calling effect.clear()");
      
      this.initialWidth = this.menu.offsetWidth;

      // if click is outside the menu, menu should be dismissed on pointerup
      let targetChain = ev.target;
      while (targetChain != null) {
        if (targetChain == this.menu)
          return;
        targetChain = targetChain.parentNode;
      }
      this.dismissOnPointerUp = true;
      return;
    }
    this.clear();
    // Create menu with zero width
    this.menu = this.menuBuilder(this, this.container, this.menuBuilderOptions);
    if (this.direction == "ltr") {
      this.menu.style.left = 0;
      this.menu.style.right = "auto";
    }
    this.defaultButton = this.menu.querySelector("[data-gesture-default]");
    this.container.append(this.menu);
    this.maxWidth = parseInt(window.getComputedStyle(this.menu).width);
    this.menu.style.width = "0";
    this.initialWidth = 0;
    // Button menu should close if another gesture starts
    if (GestureEffect.EffectCleaner)
      GestureEffect.EffectCleaner.register(this.menu, this);
  }
  moved(gesture, ev, state, delta, speed) {
    if (gesture.getState() != 'active' || !this.menu)
      return;
    this.hasMoved = true;
    let newWidth = Math.max(0, this.initialWidth + (this.direction == 'ltr' ? delta : -delta));
    // If there is no default button, do not grow bigger than maximum width.
    if (!this.defaultButton)
      newWidth = Math.min(newWidth, this.maxWidth);
    
    if (this.defaultButton) {
      // slow down the growth near the edge.
      const boundary = 16;
      let oversize = newWidth - this.container.offsetWidth + boundary;
      if (oversize > 0)
        newWidth = this.container.offsetWidth - boundary + oversize / 8;
      let defaultOn = newWidth / this.container.offsetWidth > 0.8;
      this.setDefaultMode(defaultOn);
    }
    this.animateMenuToWidth(newWidth, 0);
  }
  completed(gesture, ev, speed) {
    if (!this.menu)
      return;
    // In default mode, the large button receives a click on completion
    // and performs the default action.
    if (this.defaultModeOn) {
      this.defaultButton.dispatchEvent(new Event('click'));
      return;
    }
    // Dismiss menu if:
    // - width < 50% of menu width, or:
    // - dismissOnPointerUp && pointer has not moved
    let dismissMenu = false;
    let quickRtlFlick = speed < -GestureEffect.flickSpeed;
    let quickLtrFlick = speed > GestureEffect.flickSpeed;
    dismissMenu ||= this.direction == "rtl" ? quickLtrFlick : quickRtlFlick;
    // Menu is narrow, slow flick
    dismissMenu ||=  (this.menu.offsetWidth < this.maxWidth / 3) && (this.direction == "ltr" ? !quickLtrFlick : !quickRtlFlick);
    dismissMenu ||= this.dismissOnPointerUp && !this.hasMoved; 
    if (dismissMenu) {
      this.clear(true);
    } else {
      // if width > 50%, grow menu to full size
      this.animateMenuToWidth(this.maxWidth);
    }
  }
  cancelled(gesture, ev) {
    if (this.menu) {
      this.animateMenuToWidth(0)
        .finished.then( _ => {
          this.clear();
        })
    }
  }
}

appendStyleRule(`.${POSITION_RELATIVE_CLASS}`, `{
  position:relative !important;
}`);
