var path = require("path");
var webpackConfig = require("./webpack.config");

webpackConfig.entry = {};

module.exports = function (config) {
    config.set({
        port: 6400,
        webpack: webpackConfig,
        browsers: ["PhantomJS"],
        frameworks: ["jasmine"],
        files: [
            "test/main.ts"
        ],
        preprocessors: {
            "test/main.ts": ["webpack"]
        },
        reporters: ["mocha", "html"],
        htmlReporter: {
            outputFile: "reports/report.html",
            pageTitle: "Entity-Space Tests",
            groupSuites: true,
            useCompactStyle: true
        },
        webpackMiddleware: {
            noInfo: true
        }
    });
}