/**
 * Simple TestRunner
 * 
 * Idea:
 * - each test page has 
 */

let singleton;

export class TestRunner {

  static HTML = `<button id="runAll">Run all</button>
  <table>
    <col style="min-width:50px">
    <col style="min-width:100px">
    <col style="min-width:50px">
    <thead>
      <tr>
        <td></td><td>Test</td><td>Status</td>
      </tr>
      </thead>
    <tbody>
    </tbody>
  </table>`;
  static STYLE = `
  .testPanel {
    position: fixed;
    right: 10px;
    top: 10px;
    border: 2px dotted #9b870c;
    padding:4px;
    font-family:monospace;
  }
 /* @media (prefers-color-scheme: dark)  {
    .testPanel {
      border-color: yellow;
    }
  }*/
  .testPanel table {
    border-collapse:collapse;
    margin-top: 8px;
  }
  .testPanel td:nth-child(1) {
    text-decoration: underline;
  }
  .testPanel td {
    border: 0.5px solid #888;
    padding: 4px;
  }
  `;

  constructor() {
    this.tests = [];
    singleton = this;
  }

  #ui() {
    const TEST_PANEL_ID = "AbleTestPanel";
    let ui = document.querySelector(`#${TEST_PANEL_ID}`);
    if (!ui) {
      ui = document.createElement("div");
      ui.setAttribute("id", TEST_PANEL_ID);
      ui.classList.add("testPanel");
      ui.innerHTML = TestRunner.HTML;
      ui.querySelector("#runAll")
        .addEventListener("click" , _ => singleton.runAll());
      document.body.append(ui);
      let styleElement = document.createElement("style");
      styleElement.setAttribute("id", `${TEST_PANEL_ID}Style`);
      styleElement.textContent = TestRunner.STYLE;
      document.querySelector("head").prepend(styleElement);
    }
    return ui;
  }

  #updateTestUi(testIndex) {
    let ui = this.#ui();
    let tbody = ui.querySelector('tbody');
    let testRow = tbody.querySelector(`:nth-child(${testIndex+1})`);
    if (!testRow) {
      testRow = document.createElement("tr");
      let td = document.createElement("td");
      td.addEventListener("click", _ => {
        singleton.runOne(testIndex);
      });
      td.textContent = "Run";
      testRow.append(td);
      testRow.append(document.createElement("td"));
      testRow.append(document.createElement("td"));
      tbody.append(testRow);
    }
    let nameTd = testRow.querySelector(":nth-child(2)");
    let statusTd = testRow.querySelector(":nth-child(3)");
    nameTd.textContent = this.tests[testIndex].name;
    statusTd.textContent = this.tests[testIndex].status;
  }

  // Returns test number.
  test(fn, name) {
    this.tests.push({test: fn, name: name, status: "-"});
    this.#updateTestUi(this.tests.length - 1);
    return this.tests.length - 1;
  }

  runOne(testIndex) {
    if (testIndex >= this.tests.length) {
      document.body.style.backgroundColor = "red";
      console.error("trying to run nonexistent test!!!!")
    }
    let reportError = err => {
      console.error(err, testIndex);
      this.tests[testIndex].status = `FAIL: ${err}`;
      this.#updateTestUi(testIndex);
    }
    let reportSuccess = v => {
      this.tests[testIndex].status =`PASS${ v == null ? "" : ": " + v }`;
      this.#updateTestUi(testIndex);
    }
    this.tests[testIndex].status = "RUNNING";
    this.#updateTestUi(testIndex);
    try {
      let v =this.tests[testIndex].test();
      if (v && v.then) {
        v.then(reportSuccess, reportError);
      } else
        reportSuccess(v);
    } catch(err) {
      reportError(err);
    }
  }

  runAll() {
    for (let i=0; i<this.tests.length; ++i)
      this.runOne(i);
  }
}

export default new TestRunner();
