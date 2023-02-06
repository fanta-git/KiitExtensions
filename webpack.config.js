const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: process.env.NODE_ENV || "development",
    entry: {
        script: path.join(__dirname, "src/script.ts"),
        iframe: path.join(__dirname, "src/iframe.ts"),
        option_script: path.join(__dirname, "src/option_script.ts"),
    },
    output: {
        path: path.join(__dirname, "dist/js"),
        filename: "[name].js",
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    plugins: [
        // new CopyPlugin({
        //     patterns: [
        //         {
        //             from: ".",
        //             to: "/",
        //             context: "public"
        //         }
        //     ]
        // })
    ],
    devtool: 'cheap-module-source-map',
    cache: true,
    watchOptions: {
        poll: true,
    }
};

