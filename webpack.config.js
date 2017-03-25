var path = require("path");
var webpack = require("webpack");

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
        extensions: [".ts", ".tsx", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    { loader: "awesome-typescript-loader" }
                ]
            }
        ]

    },
    plugins: [
        new webpack.SourceMapDevToolPlugin({
            filename: null, // if no value is provided the sourcemap is inlined
            test: /\.(ts|js)($|\?)/i // process .js and .ts files only
        })
    ]
};