# Running tests

## Run the entire test suite
```bash
# Run entire test suite automatically
cd js-gestures
npm install 
# start local server
npm run localhost
# now open a new terminal
# run the whole test suite inside the new terminal
npm run test
```

## Run selected tests manually

All tests are inside independed html files inside `./test` directory.
Open any file, and you'll see a test runner in top right corner.

# Writing your own tests

A test is an async function. It should throw an error on failure.
See any existing test files for examples.

# Test framework architecture

Selenium is the only dependency. The rest is a custom-written minimalist framework.

`framework/testFramework.js` defines TestRunner, a framework for running unit tests inside a single HTML file. Usage is simple:

```javascript
TestRunner.test(test1,  "Test title" );
TestRunner.test(test2,  "Another test title" );

await TestRunner.runOne(0);
await TestRunner.runAll();
```

A test is just an async function that throws on error. Any returned value will be
reported.

If you'd like to visually slow down animations, set GestureEffect.ANIM_TIME in ms

Selenium is used to run all tests automatically in different browsers.

`utils.js` has helper functions that are useful for testing gestures.
