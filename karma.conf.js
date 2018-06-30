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
            resolve: {
                extensions: [".ts", ".tsx", ".js"]
            },
            module: {
                rules: [{
                        test: /\.ts$/,
                        loader: "awesome-typescript-loader"
                    },
                    {
                        enforce: "post",
                        test: /\.ts$/,
                        loader: "istanbul-instrumenter-loader",
                        include: /src/,
                        exclude: /\.spec\.ts$/
                    }
                ]
            },
            plugins: [
                // allows source inspection @ browser
                new webpack.SourceMapDevToolPlugin({
                    filename: null,
                    test: /\.(ts|js)($|\?)/i
                })
            ]
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