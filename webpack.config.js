const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: process.env.NODE_ENV || "development",
    entry: {
        script: path.join(__dirname, "src/script.ts"),
        iframe: path.join(__dirname, "src/iframe.ts"),
        options: path.join(__dirname, "src/options.ts"),
    },
    output: {
        path: path.join(__dirname, "dist"),
        filename: "js/[name].js",
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.(scss|sass|css)$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: './css/[name].css'
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: ".",
                    to: ".",
                    context: "public"
                }
            ]
        }),
    ],
    devtool: 'cheap-module-source-map',
    cache: true,
    watchOptions: {
        poll: true,
    }
};

