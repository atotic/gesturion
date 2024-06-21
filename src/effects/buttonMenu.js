 import appendStyleRule from "../gestureStyles.js"

 /**
   * Creates a button menu used for swiping left.
   * @arg {Object} options - 
   * @param {Object[]} options.items - button descriptions
   * @param {string} options.items[].title - button title
   * @param {string} options.items[].color - button color
   * @param {string} options.items[].click - click handler
   * @param {string} options.items[].preventClickAutoClose - if true, click handler will not auto-close the menu
   * @param {string} options.items[].default - item to expand to full length on long swipe
   * @param {string} options.containerClass  - CSS class to assign to menu container
   * @param {string} options.itemClass - CSS class to assign to button
   * @returns menu element
   */
let CONTAINER_CLASS = "swipeHorizontalButtonMenuContainer";
let ITEM_CLASS = "swipeHorizontalMenuItem";

export default function createButtonMenu(effect, container, options) {
  let menu = document.createElement("div");
  menu.classList.add(options.containerClass || CONTAINER_CLASS);
  for (let item of options.items || [{title: "Specify menuItemOptions.items", color: "red"}]) {
    let dom = document.createElement('div');
    if (item.default)
      dom.setAttribute("data-gesture-default", 1);
    dom.classList.add(options.itemClass || ITEM_CLASS);

    let title = document.createElement("div");
    title.classList.add("title");
    title.innerText = item.title;
    dom.append(title);
    dom.style.backgroundColor = item.color;

    let actionListener = (ev) => effect.clear(); // Default listener closes the menu
    if (item.action) {
      if (item.preventClickAutoClose)
        actionListener = item.action;
      else {
        let itemAction = item.action;
        actionListener = ev => {
          try {
            itemAction(ev);
          } catch(err) {
            console.error("Uncaught exception in buttonMenu item action", err);
          } finally {
            effect.clear();
          }
        }
      }
    } 
    dom.addEventListener("click", actionListener);
    menu.append(dom);
  }
  return menu;
}

appendStyleRule(`.${CONTAINER_CLASS}`, `{
  display:flex;
  position:absolute;
  right: 0;
  top:0;
  height: 100%;
  user-select: none;
  -webkit-user-select: none;
}`);
appendStyleRule(`.${ITEM_CLASS}`, `{
  flex-grow: 1;
  flex-basis: 3.5em;
  flex-shrink: 1;
  min-width: 0;
  color: white;
  overflow:hidden;
}`);
appendStyleRule(`.${ITEM_CLASS} .title`, `{
  display:flex;
  width:4em;
  position:relative;  /* vertical centering */
  top:50%;
  transform: translateY(-50%);
  justify-content:center; /* horizontal centering */
}`);
