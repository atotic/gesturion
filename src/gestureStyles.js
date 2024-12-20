/**
 * Stylesheet manipulation for gesture library =
 * 
 * gesture code adds styles dynamically to a style tag.
 * This avoids packaging all the styles in a single css file.
 * In a single CSS file, most styles would remain unused.
 * Usage:
import appendStyleRule from "../gestureStyles.js"
appendStyleRule(`.${SelectNoneCSSClass}`, `{
  user-select: none;
}`);
 */

export default function appendStyleRule(selector, declaration) {
  let SHEET_ID = "gesturion-styles";
  let styleElement = document.getElementById(SHEET_ID);
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.setAttribute("id", SHEET_ID);
    document.querySelector("head").prepend(styleElement);
  }
  let sheet = styleElement.sheet;
  for (let r of sheet.cssRules) {
    if (r.constructor.name == CSSRule.STYLE_RULE && r.selectorText == selector) {
      console.warn(`Style ${selector} already exists inside ${SHEET_ID}`);
    }
  }
  styleElement.textContent = styleElement.textContent + `${selector} ${declaration}\n`;
}
