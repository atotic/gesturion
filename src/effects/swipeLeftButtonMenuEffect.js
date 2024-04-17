/*
Implements menu that displays when you swipe left
 */
import appendStyleRule from "../gestureStyles.js"
import GestureEffect from "./gestureEffect.js";

let POSITION_RELATIVE_CLASS="swipeLeftPositionRelative";

export default class SwipeLeftButtonMenuEffect extends GestureEffect {

  leftMenu; // Menu being displayed

  // Menu container. Needs to be an "absolute positioning containing block"
  // https://drafts.csswg.org/css-position/#ref-for-absolute-positioning-containing-block%E2%91%A0
  container;
  // CSS selector for content that should scroll as menu is revealed.
  // If empty, content will not scroll
  contentSelector;
  menuBuilder;  // Callback fn(effect, container, menuBuilderOptions)
  menuBuilderOptions;
  constructor(options) {
    super(options);
    for (let p of ['container', 'menuBuilder'])
      if (!p in options)
        throw `${p} must not be null`;
    this.container = options.container;
    this.contentSelector = options.contentSelector;
    this.menuBuilder = options.menuBuilder;
    this.menuBuilderOptions = options.menuBuilderOptions;
  }
  contentElement(){
    if (this.contentSelector)
      return this.container.querySelector(this.contentSelector);
    return null;
  }
  animateMenuToWidth(finalWidth, duration=300) {
    let animOptions = {
      duration: duration,
      easing: 'ease-out'
    };
    let menuAnimation =  this.leftMenu.animate(
      [
        {width: `${this.leftMenu.offsetWidth}px`},
        {width: `${finalWidth}px`}
      ], animOptions);
    menuAnimation.finished.then( _ => {
      if (this.leftMenu)
        this.leftMenu.style.width = `${finalWidth}px`;
    });
    let content = this.contentElement();
    if (content) {
      content.classList.add(POSITION_RELATIVE_CLASS);
      content.animate(
        [ 
          { left: `${content.offsetLeft}px`},
          { left: `-${finalWidth}px`}
        ], animOptions).finished.then( _ => {
          content.style.left = `-${finalWidth}px`;
        });
    } else {
      console.warn("no content");
    }
    return menuAnimation;
  }

  // GestureEffect overrides
  
  idleStart (){}
  waitStart (){}
  activeStart(gesture, ev) {
    this.clear();
    // Create menu with zero width
    this.leftMenu = this.menuBuilder(this, this.container, this.menuBuilderOptions);
    this.container.append(this.leftMenu);
    this.maxWidth = parseInt(window.getComputedStyle(this.leftMenu).width);
    this.leftMenu.style.width = "0";
  }
  moved(gesture, ev, state, delta) {
    if (gesture.getState() != 'active')
      return;
    if (this.leftMenu) {
      let newWidth = Math.max(0, Math.min(delta, this.maxWidth));
      this.animateMenuToWidth(newWidth, 0);
    }
  }
  completed(gesture, ev) {
    if (this.leftMenu.offsetWidth < this.maxWidth / 2) {
      // If width < 50% remove menu
      this.animateMenuToWidth(0)
        .finished.then( _ => {
          this.clear();
        });
    } else {
      // if width > 50%, grow menu to full size
      this.animateMenuToWidth(this.maxWidth);
    }
  }
  cancelled(gesture, ev) {
    if (this.leftMenu) {
      this.animateMenuToWidth(0)
        .finished.then( _ => {
          this.clear();
        })
    }
  }
  clear(animate) {
    // Should there be an option to animate?
    if (this.leftMenu) {
      let cleanup = () => {
        this.leftMenu.remove();
        delete this.leftMenu;
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
}

appendStyleRule(`.${POSITION_RELATIVE_CLASS}`, `{
  position:relative !important;
}`);