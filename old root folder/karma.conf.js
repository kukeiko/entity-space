let npmCommand = process.env.npm_lifecycle_event;

let browsers = ["ChromeHeadless"];
let reporters = ["mocha"];
let withCoverage = true;

if (npmCommand.includes(":watch")) {
    browsers = ["Chrome"];
    reporters.push("coverage-istanbul");
} else if (npmCommand.includes(":debug")) {
    browsers = ["Chrome"];
    withCoverage = false;
} else {
    process.env.CHROME_BIN = require("puppeteer").executablePath();
    reporters.push("coverage-istanbul");
}

module.exports = function (config) {
    let webpackModuleRules = [
        {
            test: /\.ts$/,
            loader: "ts-loader",
            options: {
                configFile: "tsconfig-test.json",
            },
        },
    ];

    if (withCoverage) {
        webpackModuleRules.push({
            enforce: "post",
            test: /\.ts$/,
            loader: "istanbul-instrumenter-loader",
            include: /src/,
            exclude: [/\.spec\.ts$/, /test(\/|\\)/],
        });
    }

    config.set({
        frameworks: ["jasmine", "webpack"],
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
                    src: `${__dirname}/src`,
                    "@entity-space/utils": `${__dirname}/src/utils/public.ts`,
                    "@entity-space/core": `${__dirname}/src/core/public.ts`,
                },
            },
            module: {
                rules: webpackModuleRules,
            },
        },
        reporters,
        mochaReporter: {
            ignoreSkipped: true,
            output: "minimal",
        },
        coverageIstanbulReporter: {
            reports: ["text-summary", "html"],
        },
        webpackMiddleware: {
            noInfo: true,
        },
        mime: {
            // so chrome doesn"t refuse execution
            "text/x-typescript": ["ts", "tsx"],
        },
    });
};