var path = require("path");
var webpackConfig = require("./webpack.config");

webpackConfig.entry = {
    "unit-tests": "./test/main.ts"
};

module.exports = function (config) {
    config.set({
        port: 6400,
        webpack: webpackConfig,
        browsers: ["Chrome"],
        frameworks: ["jasmine"],
        files: [
            "./test/main.ts"
        ],
        preprocessors: {
            "./test/main.ts": ["webpack"]
        },
        reporters: ["mocha"],
        webpackMiddleware: {
            noInfo: true
        },
        // so chrome doesn't refuse execution
        mime: {
            'text/x-typescript': ['ts', 'tsx']
        }
    });
}