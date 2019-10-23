var path = require("path");
var webpack = require("webpack");
let npmCommand = process.env.npm_lifecycle_event;

let browsers = ["ChromeHeadless"];

if (npmCommand.includes(":watch")) {
    browsers = ["Chrome"];
}

module.exports = function (config) {
    config.set({
        frameworks: ["jasmine"],
        browsers: browsers,
        port: 6400,
        files: ["./test/entry.ts"],
        preprocessors: {
            "./test/entry.ts": ["webpack"],
        },
        webpack: {
            devtool: "inline-source-map",
            mode: "development",
            resolve: {
                extensions: [".ts", ".tsx", ".js"],
                alias: {
                    "@elements": path.resolve("./src/elements"),
                    "@metadata": path.resolve("./src/metadata"),
                    "@sandbox": path.resolve("./src/sandbox"),
                    "@sandbox-8": path.resolve("./src/sandbox-8"),
                    "@sample-types": path.resolve("./src/playground/types")
                }
            },
            module: {
                rules: [
                    {
                        test: /\.ts$/,
                        loader: "ts-loader",
                        options: {
                            configFile: "tsconfig-test.json"
                        }
                    },
                    {
                        enforce: "post",
                        test: /\.ts$/,
                        loader: "istanbul-instrumenter-loader",
                        include: /src/,
                        exclude: /\.spec\.ts$/
                    }
                ]
            }
        },
        reporters: ["mocha", "coverage-istanbul"],
        mochaReporter: {
            ignoreSkipped: true
        },
        coverageIstanbulReporter: {
            reports: ["text-summary", "html"]
        },
        webpackMiddleware: {
            noInfo: true
        },
        mime: {
            "text/x-typescript": ["ts", "tsx"]
        } // so chrome doesn"t refuse execution
    });
}