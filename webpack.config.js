const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: process.env.NODE_ENV || "development",
    entry: {
        script: path.join(__dirname, "src/script.ts"),
        iframe: path.join(__dirname, "src/iframe.ts"),
        options: path.join(__dirname, "src/options.ts"),
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
            filename: '../css/[name].css'
        }),
        new HtmlWebpackPlugin({
            template: './src/html/options.html',
            filename: '[name].html',
            chunks: ['options']
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: ".",
                    to: "../",
                    context: "public"
                }
            ]
        }),
        // new CleanWebpackPlugin({
        //     verbose : true ,
        //     cleanOnceBeforeBuildPatterns: ['.']
        // }),
    ],
    devtool: 'cheap-module-source-map',
    cache: true,
    watchOptions: {
        poll: true,
    }
};

