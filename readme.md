# entity-space

Strictly typed data framework for consuming HTTP services.

Serves a similar purpose as GraphQL and was initially inspired by the LightSwitch OData implementation which has been discontinued in 2015.

# Introduction

The whole point of entity-space is to have a common structure for all types of queries.

A query consists of:

-   the **model**, describing the shape of the data and optionally loadable parts it might have
-   the **criteria**, describing the filter the loaded data has to fulfill, e.g. "id in (1, 2)"
-   the **selection**, describing what optional parts of data should be included that are not loaded by default
-   the **options**, a custom user object to represent what the criteria can't (e.g. server side filter)

Based on the **options** and **criteria**, entity-space can understand the identity of the data that will be loaded. Based on the **selection**, entity-space can understand what optional parts are included.

Using that information, together with implementation work by the user, we could think up some useful features:

-   multiplexing (make multiple queries behave as one)
-   strictly typed hydration of optional data (hydrated properties will no longer be "undefined")
-   deferred hydrations, as in: show some initial data as quickly as possible, and load remainder in the background
-   define "virtual" relations between data, i.e. relations that don't exist according to the backend
-   diffing of data to understand changes between them
-   caching:
    -   cache data long/short term
    -   cache data as long as current UI view exists (hierarchical caching)
    -   load cached data immediately to quickly render UI, but reload fresh data from server in the background and rerender with updates
    -   cache data and refresh every x seconds
    -   any other cache invalidation/sync technique you can think of
-   throttling:
    -   prevent unnecessary API calls if a currently pending query contains all of the expected data
    -   reduce API calls in their expected response size if a currently pending query already contains part of the expected data
    -   prevent excessively huge queries altogether or cut them down / slice them into smaller pieces

# Status

Very much work in progress, but we're getting there.

The immediate goals are:

-   multiplexing
-   strictly typed hydrations
-   virtual relations

To reach those, we need to provide an interface with which the user describes their queries and how they are to be executed.

To enable strictly typed hydrations and still support IE11, we'll have to rely on the user providing some minimal metadata.
Shouldn't be too big of a deal since in the future we'll probably expect some metadata anyway to provide some default implementations for commonly used API interfaces.

# Current concept of the core loading mechanism

## step 1: take an incoming query and translate it into an array of concurrent streams

why an array and why concurrent? easy: imagine a query that tries to load some cat gifs, for which it will ask various cat gif apis. for each api, have a stream that runs concurrently to the others.

each stream might be:

-   a single http request
-   a series of sequential http requests
-   a temporary websocket stream that closes once the data is loaded
-   an endless websocket stream that runs until closed by client/server

each stream emits packets:

-   a stream that is a single http request will emit exactly 1 packet
-   a stream that is a series of sequential http requests will emit _n_ or an unknown number of packets (possibly endless as well, i.e. polling)
-   a temporary stream emits _n_ packets
-   an endless stream emits unknown number of packets

next to the loaded data, each packet includes:

-   a query describing the data contained within that packet
-   an array of queries whose payload will arrive in a future packet from the same stream (the "open" queries)
-   an array of queries the server failed to load

the queries inside the packets are required for entity-space to understand what's going on:

-   what data was actually loaded?
-   will a single stream continue to deliver more?
-   what data failed to load and should be errored to the user?
-   what data will never be included and has to be hydrated by entity-space (i.e. virtual relations)?

## step 2: observe the streams and emit hydrated data

1. listen to each stream returned by the component that translated the incoming query

2. for each packet emitted by a stream, figure out if client-side hydration is needed (i.e. requested data is not contained within the "open queries" array of the packet)

    if yes, use yet another user supplied implementation to translate loaded data & required query into hydration instructions which in turn are queries themselves that will apply mapping logic once those queries are loaded. this will run recursively until all data is hydrated.

3. emit hydrated data and data load failures to the user

# Contributing

Submit a pull request. One can pick one of the issues labeled with the "good first issue" label.  
The repository is commitizen friendly, so commits should follow [this](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines) commit guidelines.  
We are using the [cz-customize](https://github.com/leonardoanalista/cz-customizable) plugin. The configuration can be found in the [**.cz-config.js**](./.cz-config.js) file.

**TL;DR:** Once you feel you are ready to submit your changes just execute this command in your console:

```bash
npm run commit
```

It will give you a nice prompt and will ask is it a feature/bug/refactoring see below:  
![prompt](https://raw.githubusercontent.com/commitizen/cz-cli/master/meta/screenshots/add-commit.png)

Then you specify what is a subject of the changes you provide and it generates  
the commit message that is consistent with the commit messages in this repository.

# TSLint / ESLint

We're still using TSLint for the files found in the test/types folder, as I was not happy with the alternatives for testing types that exist (i.e. tsd)

-   with the tslint VS code extension, you get immediate feedback in the test file
-   tsd wants us to first generate .d.ts files, which is a completely unnecessary step for us

So we're using ESLint for everything, and TSLint just for the test/type files.

We can drop TSLint once dtslint (which is the actual tool used for running our type tests, see package.json "test-types" script) migrates to ESLint.

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

##

Template:

**Q:**  
**A:**
