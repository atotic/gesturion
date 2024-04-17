 import appendStyleRule from "../gestureStyles.js"

 /**
   * Creates a button menu used for swiping left.
   * @arg {Object} options - 
   * @param {Object[]} options.items - button descriptions
   * @param {string} options.items[].title - button title
   * @param {string} options.items[].color - button color
   * @param {string} options.containerClass  - CSS class to assign to menu container
   * @param {string} options.itemClass - CSS class to assign to button
   * @returns menu element
   */
let CONTAINER_CLASS = "swipeLeftMenuContainer";
let ITEM_CLASS = "swipeHorizontalMenuItem";

export default function createButtonMenu(effect, container, options) {
  let menu = document.createElement("div");
  menu.classList.add(options.containerClass || CONTAINER_CLASS);
  for (let i of options.items || [{title: "Specify menuItemOptions.items", color: "red"}]) {
    let m = document.createElement('div');
    m.classList.add(options.itemClass || ITEM_CLASS);
    m.addEventListener("click", ev => {
      console.log("Item clicked", i.title);
      effect.clear();
    });
    let title = document.createElement("div");
    title.classList.add("title");
    title.innerText = i.title;
    m.append(title);
    m.style.backgroundColor = i.color;
    menu.append(m);
  }
  return menu;
}

appendStyleRule(`.${CONTAINER_CLASS}`, `{
  display:flex;
  position:absolute;
  right: 0;
  top:0;
  height: 100%;
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