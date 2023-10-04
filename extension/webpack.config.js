const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

module.exports = {
  target: "web",
  mode: "development",
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
    libraryTarget: "amd",
    filename: "[name].js",
    publicPath: "./dist",
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
    "react": true,
    "react-dom": true,
  },
    /^VSS\/.*/, /^TFS\/.*/, /^q$/
  ],
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      'monaco-editor': path.resolve(__dirname, "node_modules/monaco-editor/esm/vs/editor/editor.worker.js"),
      "vss-web-extension-sdk": path.resolve(__dirname, "node_modules/vss-web-extension-sdk/lib/VSS.SDK")
    },
    modules: [path.join(__dirname, 'node_modules')],
  },
  module: {
    rules: [
      { 
        test: /\.tsx?$/,
        exclude: [/node_modules/],
        include: path.resolve(__dirname, "scripts"),
        loader: "ts-loader",
      },
      {
        test: /\.scss$/,
        exclude: [/node_modules/],
        use: [
          "style-loader",
          "css-loader",
          "sass-loader",
        ]
      },
      {
        test: /\.css$/,
        exclude: [/node_modules/],
        use: [
          "style-loader", 
          "css-loader"
        ]
      },
      {
        test: /\.(png|svg|jpg|gif|html)$/,
        exclude: [/node_modules/],
        use: "file-loader"
      },
      {
        test: /\.(ttf)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'fonts/'
            }
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
    new CopyWebpackPlugin({
      patterns: [
        // { from: "./*.html", to: "./", },
        { from: "**/*.png", to: "./img", context: "./" },
        { from: "./azure-devops-extension.json", to: "./azure-devops-extension.json" },
        { from: "./node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js", to: "./" },
        { from: "./node_modules/monaco-editor/min/vs/loader.js", to: "./monaco-editor/min/vs" },
        { from: "./node_modules/monaco-editor/min/vs/editor/", to: "./monaco-editor/min/vs/editor", context: "./"  },
        { from: "./node_modules/monaco-editor/min/vs/base/", to: "./monaco-editor/min/vs/base", context: "./" },
        { from: "./node_modules/monaco-editor/min/vs/basic-languages/", to: "./monaco-editor/min/vs/basic-languages", context: "./" }
      ]
    })
  ]
};