const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  target: "web",
  entry: {
    playground: "./scripts/wiqlPlayground/playground.ts",
    queryContext: "./scripts/queryContext/queryContext.ts",
    queryEditor: "./scripts/queryEditor/queryEditor.ts"
    
  },
  output: {
    libraryTarget: "amd",
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        publicPath: "./dist",
  },
  devtool: "inline-source-map",
  externals: [{
    "q": true,
    "react": true,
    "react-dom": true,
    "monaco": true,
    },
        /^TFS\//, // Ignore TFS/* since they are coming from VSTS host 
        /^VSS\//  // Ignore VSS/* since they are coming from VSTS host
    ],
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      "VSSUI": path.resolve(__dirname, "node_modules/azure-devops-ui"),
      "VSS": path.resolve(__dirname, "node_modules/vss-web-extension-sdk"),
      "monaco": path.resolve(__dirname, "node_modules/monaco-editor"),
    },
    modules: [path.resolve("."), "node_modules"]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "tslint-loader",
        enforce: "pre",
        options: {
            emitErrors: true,
            failOnHint: true,
            
        }
    },
      {
        test: /\.tsx?$/,
        use: "ts-loader"
      },
      {
        test: /\.scss$/,
        use: [
          "style-loader",
          "css-loader",
          "sass-loader"
        ]
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(png|svg|jpg|gif|html)$/,
        use: "file-loader"
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: "./*.html", to: "./",  },
        { from: "**/*.png", to: "./img", context: "./"},
        { from: "./styles", to: "./styles", context: "./" },
        { from: "./azure-devops-extension.json", to: "./azure-devops-extension.json" },
        { from: "./node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js", to: "./" },
      ]
    })
  ]
};