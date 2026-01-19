/* eslint-disable no-undef */
const devCerts = require("office-addin-dev-certs");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const dotenv = require("dotenv");
const webpack = require("webpack");

dotenv.config(); // Charger les variables d'environnement depuis .env
console.log("ADDIN_BASE_URL lu par Webpack:", process.env.ADDIN_BASE_URL);

const urlDev = "https://localhost:3000/";
const urlProd = process.env.ADDIN_BASE_URL;

async function getHttpsOptions() {
  const httpsOptions = await devCerts.getHttpsServerOptions();
  return { ca: httpsOptions.ca, key: httpsOptions.key, cert: httpsOptions.cert };
}

module.exports = async (env, options) => {
  const dev = options.mode === "development";
  const baseUrl = dev ? urlDev : urlProd;

  const config = {
    devtool: "source-map",
    entry: {
      polyfill: ["core-js/stable", "regenerator-runtime/runtime"],
      taskpane: ["./src/taskpane/taskpane.ts", "./src/taskpane/taskpane.html"],
      commands: "./src/commands/commands.ts",
      index: ["./src/home/index.ts", "./src/home/index.html"],
      help: ["./src/faq/help.ts", "./src/faq/help.html"],
      changelog: "./src/changelog/changelog.html",
    },
    output: {
      clean: true,
    },
    resolve: {
      extensions: [".ts", ".html", ".js"],
      fallback: {
        os: require.resolve("os-browserify/browser"),
        crypto: false,
      },
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },
        {
          test: /\.html$/,
          exclude: /node_modules/,
          use: "html-loader",
        },
        {
          test: /\.(png|jpg|jpeg|gif|ico)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/[name][ext][query]",
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: "taskpane.html",
        template: "./src/taskpane/taskpane.html",
        chunks: ["polyfill", "taskpane"],
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "assets/*",
            to: "assets/[name][ext][query]",
          },
          {
            from: "manifest*.xml",
            to: "[name][ext]",
            transform(content) {
              return content.toString().replace(/{ADDIN_BASE_URL}/g, baseUrl);
            },
          },
        ],
      }),
      new HtmlWebpackPlugin({
        filename: "index.html",
        template: "./src/home/index.html",
        chunks: ["polyfill", "index"],
      }),
      new HtmlWebpackPlugin({
        filename: "help.html",
        template: "./src/faq/help.html",
        chunks: ["polyfill", "help"],
      }),
      new HtmlWebpackPlugin({
        filename: "changelog.html",
        template: "./src/changelog/changelog.html",
        chunks: [],
      }),

      new HtmlWebpackPlugin({
        filename: "commands.html",
        template: "./src/commands/commands.html",
        chunks: ["polyfill", "commands"],
      }),
      new webpack.DefinePlugin({
        "process.env": JSON.stringify({
          ADDIN_BASE_URL: process.env.ADDIN_BASE_URL,
          ROOM_NAME_LENGTH: process.env.ROOM_NAME_LENGTH,
          ROOM_NAME_PREFIX: process.env.ROOM_NAME_PREFIX,
          ROOM_NAME_MODE: process.env.ROOM_NAME_MODE,
          DIALINNUMBER_URL: process.env.DIALINNUMBER_URL,
          DIALINCONFCODE_URL: process.env.DIALINCONFCODE_URL,
          ENABLE_PHONE_ACCESS: process.env.ENABLE_PHONE_ACCESS,
          JITSI_DOMAIN: process.env.JITSI_DOMAIN,
          PHONE_NUMBER_FORMAT: process.env.PHONE_NUMBER_FORMAT,
          ENABLE_MODERATOR_OPTIONS: process.env.ENABLE_MODERATOR_OPTIONS,
          TITLE_MEETING_DETAILS: process.env.TITLE_MEETING_DETAILS,
          DEBUG: process.env.DEBUG,
        }),
      }),
    ],
    devServer: {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      server: {
        type: "https",
        options: env.WEBPACK_BUILD || options.https !== undefined ? options.https : await getHttpsOptions(),
      },
      port: process.env.npm_package_config_dev_server_port || 3000,
    },
  };

  return config;
};
