# entity-space

Not yet usable library that is supposed to help a frontend / fullstack developer load & persist data.

Can be compared to GraphQL and was initially inspired by the LightSwitch OData implementation which has been discontinued in 2015.

# TSLint / ESLint

We're still using TSLint for the files found in the test/types folder, as I was not happy with the alternatives for testing types that exist (i.e. tsd)

-   with the tslint VS code extension, you get immediate feedback in the test file
-   tsd wants us to first generate .d.ts files, which for now is an unnecessary step

So we're using ESLint for everything, and TSLint just for the files in the test/types folder.

We can drop TSLint once dtslint (which is the actual tool used for running our type tests, see package.json "test-types" script) migrates to ESLint.

# Running Tests

Run tests once including coverage (and type-tests, the only commmand that runs them):

```bash
$ npm run test
```

Run tests in watch-mode with coverage:

```bash
$ npm run test:watch
```

Run tests in watch-mode without coverage so that sourcemaps in browser console work:

```bash
$ npm run test:debug
```

# FAQ

**Q:** I have the following error when I try to

```bash
$ npm run test
```

No binary for ChromeHeadless browser on your platform.
Please, set "CHROME_BIN" env variable.

**A:** You have to set the CHROME_BIN variable, in linux you can execute this in terminal:

```bash
$ export CHROME_BIN=/usr/local/bin/my-chrome-build
```

More details for running karma with different browsers can be found [here](http://karma-runner.github.io/4.0/config/browsers.html) .
**Note:** puppeteer should fix this issue consistently on all the OSes, so feel free to create an issue in case it didnt work for you out of the box.

##

**Q:** Why is prepublish called npm prepublish?  
**A:** Npm doesnt distinguish between npm install and prepublish. See more details [here](https://github.com/npm/npm/issues/3059)

**Q:** When i run "npm run test-types" i get an error similar to this: "Errors in typescript@3.9 for external dependencies: ...", what do i do?  
**A:** The minimum dtslint typescript version needs to be updated in the index.d.ts of the types test folder (should be "test/types/index.d.ts")

##

Template:

**Q:**  
**A:**
