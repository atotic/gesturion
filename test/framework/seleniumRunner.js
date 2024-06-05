/**
 * Script that runs all the tests in current directory)
 
TODO run all tests, not just one!
// https://www.npmjs.com/package/fast-glob
// https://www.selenium.dev/documentation/webdriver/
 */
const {By, Builder, Browser, logging, until} = require('selenium-webdriver');
const { colorize } = require('colorize-node');


var TESTS = [
  "testSwipeHorizontal.html", 
  "testSwipeVertical.html",
  "testRotate.html",
  "testPinch.html",
  "testDrag.html",
  "testPress.html",
  "testActiveLiveness.html",
  "testMemory.html",
  "testInlineHandler.html"
];

// const TESTHOST='127.0.0.1:8082';
const TESTHOST='192.168.1.7:8082';
const assert = require("assert");

var failedTests = [];
var testCount = 0;

async function awaitTimeout(timeout=200) {
  return new Promise((resolve, reject) => {
    setTimeout( _ => resolve(), timeout);
  });
}

async function runTest(fileName, driver, browser) {
  let startTime = Date.now();
  let url = `http://${TESTHOST}/test/${fileName}`;
  await driver.get(url);
  let title = await driver.getTitle();
  await driver.wait(until.elementLocated(By.className('automatedTestReadyForClick')));
  let runAllButtom = await driver.findElement(By.className('automatedTestReadyForClick'));
  await runAllButtom.click();
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
  let t;
  try {
    console.log(colorize.white(browser));
    driver = await new Builder().forBrowser(browser).build();
    // const logging = require('selenium-webdriver/lib/logging');
    // logger = logging.getLogger('driver');
    // logger.setLevel(logging.Level.ALL);
    // logging.installConsoleHandler();
    await driver.manage().setTimeouts({implicit: 10000});
    for (t of TESTS)
      await runTest(t, driver, browser);
    console.log(colorize.white(browser + " complete"));
  } catch(e) {
    console.log(browser, t, e);
    failedTests.push({
      browser: browser,
      fileName: t,
      status: "FAIL: Infra failure!",
      name: "INFRA"
    });
  } finally {
    await driver.quit();
  }
}

async function runAllTestsWithIPhone() {
  let driver;
  let t;
  let browser = "iPhone";
  try {
    const logging = require('selenium-webdriver/lib/logging');
    logger = logging.getLogger('driver');
    logger.setLevel(logging.Level.ALL);
    logging.installConsoleHandler();
    console.log(colorize.white(browser));
    driver = await new Builder()
      .withCapabilities({
        'safari:deviceType': 'iPhone',
        'safari:useSimulator': true,
        'platformName': 'ios',
      })
    .forBrowser("safari").build();

    // const logging = require('selenium-webdriver/lib/logging');
    // logger = logging.getLogger('driver');
    // logger.setLevel(logging.Level.ALL);
    // logging.installConsoleHandler();
    await driver.manage().setTimeouts({implicit: 10000});
    for (t of TESTS)
      await runTest(t, driver, browser);
    console.log(colorize.white(browser + " complete"));
  } catch(e) {
    console.log(browser, t, e);
    failedTests.push({
      browser: browser,
      fileName: t,
      status: "FAIL: Infra failure!",
      name: "INFRA"
    });
  } finally {
    await driver.quit();
  }
}

(async function main() {
  let startTime = Date.now();
  try {
    // Runs all browsers in parallel
    let browserSuites = [];
    browserSuites.push(runAllTestsWithBrowser(Browser.SAFARI));
    browserSuites.push(runAllTestsWithBrowser(Browser.CHROME));
    browserSuites.push(runAllTestsWithBrowser(Browser.FIREFOX));
    // browserSuites.push(runAllTestsWithIPhone());
    await Promise.all(browserSuites);
    // Safari often fails if run in parallel with Chrome/Firefox
    // await runAllTestsWithBrowser(Browser.SAFARI);
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
