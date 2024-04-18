/*
Implements menu that displays when you swipe left
 */
import appendStyleRule from "../gestureStyles.js"
import GestureEffect from "./gestureEffect.js";

let POSITION_RELATIVE_CLASS="swipeLeftPositionRelative";

export default class SwipeLeftButtonMenuEffect extends GestureEffect {

  leftMenu; // Menu being displayed
  defaultButton;  // Default button, if specified as data-gesture-default
  defaultModeOn; // True if default mode is active

  // Options:
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
  contentElement() {
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

  setDefaultMode(defaultOn) {
    if (defaultOn == this.defaultModeOn)
      return;
    // Default button mode, hide other buttons
    let animOptions = {
      duration: 200,
      easing: 'ease-out'
    }
    for (let item of this.leftMenu.querySelectorAll(".swipeHorizontalMenuItem")) {
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
      } else {
        item.style.display = "";
      }
    }
    this.defaultModeOn = defaultOn;
  } 

  // GestureEffect overrides
  
  idleStart (){}
  waitStart (){}
  activeStart(gesture, ev) {
   
    if (this.leftMenu) {  // parentNode checks if menu is still in DOM
      if (!this.leftMenu.parentNode)
        console.error("buttonMenu deleted without calling effect.clear()");
      
      // clicking on an alredy expanded menu
      this.initialWidth = this.leftMenu.offsetWidth;
      return;
    }
    this.clear();
    // Create menu with zero width
    this.leftMenu = this.menuBuilder(this, this.container, this.menuBuilderOptions);
    this.defaultButton = this.leftMenu.querySelector("[data-gesture-default]");
    this.container.append(this.leftMenu);
    this.maxWidth = parseInt(window.getComputedStyle(this.leftMenu).width);
    this.leftMenu.style.width = "0";
    this.initialWidth = 0;
  }
  moved(gesture, ev, state, delta) {
    if (gesture.getState() != 'active')
      return;
    if (this.leftMenu) {
      // let newWidth = Math.max(0, Math.min(delta, this.maxWidth));
      let newWidth = Math.max(0, delta + this.initialWidth);
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
  }
  completed(gesture, ev) {
    // In default mode, the large button receives a click on completion
    // and performs the default action.
    if (this.defaultModeOn) {
      this.defaultButton.dispatchEvent(new Event('click'));
      return;
    }
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
    if (this.leftMenu) {
      let cleanup = () => {
        this.leftMenu.remove();
        delete this.leftMenu;
        delete this.defaultButton;
        delete this.defaultModeOn;
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