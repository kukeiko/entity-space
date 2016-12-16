var path = require("path");
var webpack = require("webpack");
var CopyWebpackPlugin = require("copy-webpack-plugin");
var CircularDependencyPlugin = require("circular-dependency-plugin");

module.exports = {
    devtool: "inline-source-map",
    devServer: {

    },
    // entry: {
    //     vendor: "./src/vendor.ts",
    //     demo: "./src/demo/demo.ts"
    // },
    // output: {
    //     path: path.join(__dirname, "./dist"),
    //     filename: "[name].js"
    // },
    resolve: {
        extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js", ".css", ".scss", ".html"]
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: "style-loader!css-loader" },
            { test: /\.scss$/, loader: "raw!sass" },
            { test: /\.html$/, loader: "raw" },
            { test: /\.tsx?$/, loader: "awesome-typescript-loader" }
        ]
    },
    plugins: [
        // new CopyWebpackPlugin([
        //     { from: "src/public" }
        // ]),
        new webpack.SourceMapDevToolPlugin({
            filename: null, // if no value is provided the sourcemap is inlined
            test: /\.(ts|js)($|\?)/i // process .js and .ts files only
        })
        // new CircularDependencyPlugin({
        //     // exclude detection of files based on a RegExp
        //     exclude: /a\.js/,
        //     // add errors to webpack instead of warnings
        //     failOnError: true
        // })
    ]
};