/**

Simple TestRunner

Usage:

import TestRunner from "./testFramework.js";

async function test1 {
  if (bad)
    throw `test1 has failed because ${bad}`;
  await goodNews();
  await moreGoodNews();
}
// Test description is:
// - function name or function.description, or description passed in at registration

test1.description = "Set test description on function, or when registering"

// Register tests
TestRunner.test(test1,  "Install menu on item 1" );
TestRunner.test(test2,  "Install menu with default" );
// Registering tests displays UI for running tests

// Run all tests
TestRunner.runAll() 

TestRunner also integrates with Selenium by runAutomatedTests
Selenium clicks on a hidden runAutomatedTests button,
and receives results as encoded JSON from #seleniumTestReport textContent
*/

let singleton;

let windowError; // Last window error, used to catch uncaught exceptions
window.addEventListener("error", (event) => {
  windowError = event;
  //{source: event.filename, lineno: event.lineno, colno:event.colno, error: event.error};
});

export class TestRunner {

  static HTML = `<button id="runAllTests">Run all <span id="timeTaken"></span></button>
  <button id="runAllTestsAutomated" style="width:1px;opacity:0"></button>
  <button id="collapse" style="float:right">^</button>
  <table>
    <col style="min-width:50px">
    <col style="min-width:100px">
    <col style="min-width:8em">
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
    bottom: 10px;
    max-width: 400px;
    border: 2px dotted #888;
    padding:4px;
    font-family:monospace;
    background-color: #ddd;
  }
  @media (prefers-color-scheme: dark)  {
    .testPanel {
      border-color: yellow;
    }
  }
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
  .hidden {
    display: none;
  }
  `;

  constructor() {
    this.tests = [];
    singleton = this;
  }

  // Runs all tests, and stores a JSON-encoded result inside a <PRE>
  runAutomatedTests() {
    // Runs all tests, stores result as JSON 
    const SELENIM_DIV = "seleniumTestReport";
    let reportDiv = document.getElementById(SELENIM_DIV);
    if (reportDiv)
      reportDiv.remove();
    reportDiv = document.createElement("pre");
    reportDiv.setAttribute("id", SELENIM_DIV);
    let report = {
      title: document.title,
      tests: []
    }
    this.runAll()
      .catch( err => {
        console.error("Error running automated tests", err);
      })
      .finally( _ => {
        for (let t of singleton.tests) {
          report.tests.push({
            name: t.name,
            status: t.status
          });
        }
        reportDiv.textContent = JSON.stringify(report);
        document.body.append(reportDiv);
      });
  }

  #ui() {
    const TEST_PANEL_ID = "AbleTestPanel";
    let ui = document.querySelector(`#${TEST_PANEL_ID}`);
    if (!ui) {
      ui = document.createElement("div");
      ui.setAttribute("id", TEST_PANEL_ID);
      ui.classList.add("testPanel");
      ui.innerHTML = TestRunner.HTML;
      ui.querySelector("#runAllTests")
        .addEventListener("click" , _ => singleton.runAll());
      ui.querySelector("#runAllTestsAutomated")
        .addEventListener("click", _ => singleton.runAutomatedTests());
      ui.querySelector("#collapse")
        .addEventListener("click", _ => {
            ui.querySelector("table").classList.toggle("hidden")
          });
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
    let testRow = tbody.querySelector(`tr:nth-child(${testIndex+1})`);
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
    let nameTd = testRow.querySelector("td:nth-child(2)");
    let statusTd = testRow.querySelector("td:nth-child(3)");
    nameTd.textContent = this.tests[testIndex].name;
    statusTd.textContent = this.tests[testIndex].status;
  }

  // Returns test number.
  test(fn, name) {
    this.tests.push({
      test: fn, 
      name: name || fn.description || fn.name,
      status: "-"
    });
    this.#updateTestUi(this.tests.length - 1);
    return this.tests.length - 1;
  }

  async runOne(testIndex) {
    if (testIndex >= this.tests.length) {
      document.body.style.backgroundColor = "red";
      console.error("trying to run nonexistent test!!!!");
      
    }
    this.tests[testIndex].status = "RUNNING";
    windowError = null;
    this.#updateTestUi(testIndex);
    try {
      let v = await this.tests[testIndex].test();
      if (!v) {
        if (windowError) {
          console.error("Test failed with uncaught error", windowError);
          throw windowError.error;
        }
      }
      this.tests[testIndex].status =`PASS${ v == null ? "" : ": " + v }`;
      this.#updateTestUi(testIndex);
    } catch(err) {
      console.error(err, testIndex);
      this.tests[testIndex].status = `FAIL: ${err}`;
      this.#updateTestUi(testIndex);
    }
  }

  async runAll() {
    console.time("Run all tests");
    let start = Date.now();
    for (let i=0; i<this.tests.length; ++i)
      await this.runOne(i);
    let taken = Date.now() - start;
    document.querySelector("#timeTaken").textContent = `${taken.toFixed()}ms`;
    console.timeEnd("Run all tests");
  }
}

export default new TestRunner();
