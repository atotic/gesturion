/**
 * Script that runs all the tests in current directory)
 
TODO run all tests, not just one!
// https://www.npmjs.com/package/fast-glob
// https://www.selenium.dev/documentation/webdriver/
 */
const {By, Builder, Browser} = require('selenium-webdriver');
const { colorize } = require('colorize-node');

const assert = require("assert");

var failedTests = [];
var testCount = 0;

async function runTest(fileName, driver, browser) {
  let startTime = Date.now();
  let url = `http://127.0.0.1:8082/test/${fileName}`;
  await driver.get(url);
  let title = await driver.getTitle();
  let runAllButton = await driver.findElement(By.id('runAllTestsAutomated'));
  await runAllButton.click();
  let json = await driver.findElement(By.id("seleniumTestReport")).getText();
  let result = JSON.parse(json);
  let timeTaken = Date.now() - startTime;
  console.log(colorize.white(`${result.title} ${result.tests.length} ${browser} tests (${timeTaken}ms)`));
  for (let i=0; i< result.tests.length; ++i) {
    testCount++;
    let out = `${result.tests[i].status}`;
    if (result.tests[i].status.match(/^FAIL/)) {
      result.tests[i].browser = browser;
      result.tests[i].fileName = fileName;
      failedTests.push(result.tests[i]);
      out = colorize.redBright(out);
    }
    out += ` ${i} ${result.tests[i].name}`;
    console.log(out)
  } 
}

async function runAllTestsWithBrowser(browser) {
  let driver;
  try {
    console.log(colorize.white(browser));
    driver = await new Builder().forBrowser(browser).build();
    await driver.manage().setTimeouts({implicit: 10000});
    let tests = ["testSwipeHorizontal.html", "testSwipeVertical.html"];
    for (let t of tests)
      await runTest(t, driver, browser);
  } catch(e) {
    console.log(e);
  } finally {
    await driver.quit();
  }
}

(async function main() {
  let startTime = Date.now();
  try {
    // Runs all browsers in parallel
    let browserSuites = [];
    browserSuites.push(runAllTestsWithBrowser(Browser.CHROME));
    browserSuites.push( runAllTestsWithBrowser(Browser.FIREFOX));
    browserSuites.push(runAllTestsWithBrowser(Browser.SAFARI));
    await Promise.all(browserSuites);
  } catch(e) {
    console.log(e);
  } finally {
    let out = `${testCount} tests run in ${((Date.now() - startTime)/1000).toFixed(1)}s`;
    console.log(colorize.white(out));
    if (failedTests.length > 0) {
      console.log(colorize.red(`${failedTests.length} FAILED TESTS`));
      for (let t of failedTests) {
        let out = `${t.browser} ${t.fileName} ${t.name} ${t.status}`;
        console.log(colorize.red(out));
      }
    }
  }
})();
