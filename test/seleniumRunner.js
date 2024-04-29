/**
 * Script that runs all the tests in current directory)
 
TODO run all tests, not just one!
// https://www.npmjs.com/package/fast-glob
// https://www.selenium.dev/documentation/webdriver/
 */
const {By, Builder, Browser} = require('selenium-webdriver');
const { colorize } = require('colorize-node');

const assert = require("assert");
(async function firstTest() {
  let driver;
  
  try {
    driver = await new Builder().forBrowser(Browser.CHROME).build();
    await driver.get('http://127.0.0.1:8082/test/testSwipeLeft.html');
    let title = await driver.getTitle();
    await driver.manage().setTimeouts({implicit: 10000});
    let runAllButton = await driver.findElement(By.id('runAllTestsAutomated'));
    await runAllButton.click();
    let json = await driver.findElement(By.id("seleniumTestReport")).getText();
    let result = JSON.parse(json);
    console.log(colorize.white(`${result.title} ${result.tests.length} tests`));
    for (let i=0; i< result.tests.length; ++i) {
      let out = `${result.tests[i].status}`;
      if (result.tests[i].status.match(/^FAIL/))
        out = colorize.redBright(out);
      out += ` ${i} ${result.tests[i].name}`;
      console.log(out)
    } 
  } catch (e) {
    console.log(e)
  } finally {
    await driver.quit();
  }
}())