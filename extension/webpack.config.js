const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const WebpackShellPluginNext = require('webpack-shell-plugin-next');

module.exports = {
  mode: "development",
  target: "web",
  entry: {
    playground: "./scripts/wiqlPlayground/playground.ts",
    queryContext: "./scripts/queryContext/queryContext.ts",
    queryEditor: "./scripts/queryEditor/queryEditor.ts"

  },
  // optimization: {
  //   chunkIds: "deterministic",
  //   concatenateModules: true
  // },
  output: {
    // libraryTarget: "amd",
    path: path.resolve(__dirname, 'dist'),
    filename: "[name].js",
  },
  devtool: "inline-source-map",
  devServer: {
    https: true,
    port: 3000,
    open: true,
    hot: true,
    static: {
      directory: path.join(__dirname, "./"),
    },
    
  },

  externals: [{
    "q": true,
    // "react": true,
    // "react-dom": true,
    "monaco": true,
    // "jquery": true,
  },
    // /^VSS\/.*/, /^TFS\/.*/, /^q$/
  ],
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      'monaco-editor': path.resolve(__dirname, "node_modules/monaco-editor/esm/vs/editor/editor.api"),
      "azure-devops-extension-sdk": path.resolve("node_modules/azure-devops-extension-sdk"),
      "VSSUI": path.resolve(__dirname, "node_modules/azure-devops-ui"),
      'jquery': path.resolve(__dirname, 'node_modules/jquery/dist/jquery.min.js')
    },
    modules: [path.join(__dirname, 'node_modules')],
  },
  module: {
    rules: [
      // {
      //   test: /wiqlEditor\/compiler\/wiqlTable\.ts$/, // replace this with the exact path to your file
      //   use: 'raw-loader',
      // },
      // {
      //   test: /\.tsx?$/, 
      //   use: [
      //     {
      //       loader: 'ts-loader',
      //       options: {
      //         // transpileOnly: true, // important for performance
      //       }
      //     }
      //   ]
      // },
      {
        test: /\.tsx?$/, 
        loader: "ts-loader",
        options: {
          transpileOnly: true
        },
        //exclude scripts/wiqlEditor/compiler/wiqlTable.ts
        // exclude: /scripts\/wiqlEditor\/compiler\/wiqlTable.ts/,
        
      },
      {
        test: /\.scss$/,
        use: [
          "style-loader",
          "css-loader",
          "sass-loader",
        ]
      },
      {
        test: /\.css$/,
        use: [
          "style-loader", 
          "css-loader",
          "azure-devops-ui/buildScripts/css-variables-loader",
          "sass-loader"
        ]
      },
      {
        test: /\.(png|svg|jpg|gif|html)$/,
        use: "file-loader"
      },
      {
        test: /\.(ttf)$/,
        use: [
          {
            loader: 'file-loader',
          }
        ]
      }
    ]
  },
  plugins: [
    // new BundleAnalyzerPlugin({
    //   openAnalyzer: false,
    //   reportFilename: "bundle-analysis.html",
    //   analyzerMode: "static"
    // }),
    
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.$': 'jquery',
      'window.jQuery': 'jquery',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "./*.html", to: "./", },
        { from: "img/*.png", to: "./" },
        { from: "./azure-devops-extension.json", to: "./azure-devops-extension.json" },
        { from: "./node_modules/azure-devops-extension-sdk/esm/SDK.min.js", to: "./" },
        { from: "./node_modules/monaco-editor/min/vs/loader.js", to: "./monaco-editor/min/vs" },
        { from: "./node_modules/monaco-editor/min/vs/editor/", to: "./monaco-editor/min/vs/editor", globOptions: { ignore: ["**/*.svg"] } },
        { from: "./node_modules/monaco-editor/min/vs/base/", to: "./monaco-editor/min/vs/base",  globOptions: { ignore: ["**/*.svg"] } },
        { from: "./node_modules/monaco-editor/min/vs/basic-languages/", to: "./monaco-editor/min/vs/basic-languages/src/[name].js", globOptions: { ignore: ["**/*.svg"] } }
      ]
    })
  ]
};


