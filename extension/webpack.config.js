const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  target: "web",
  mode: "production",
  entry: {
    playground: "./scripts/wiqlPlayground/playground.ts",
    queryContext: "./scripts/queryContext/queryContext.ts",
    queryEditor: "./scripts/queryEditor/queryEditor.ts"

  },
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
    /^TFS\//, // Ignore TFS/* since they are coming from VSTS host 
    /^VSS\//  // Ignore VSS/* since they are coming from VSTS host
  ],
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      'monaco-editor': path.resolve(__dirname, "node_modules/monaco-editor/esm/vs/editor/editor.worker.js"),
      "vss-web-extension-sdk": path.resolve(__dirname, "node_modules/vss-web-extension-sdk"),
    },
    modules: [path.join(__dirname, 'node_modules')],
  },
  module: {
    rules: [
      { 
        test: /\.tsx?$/,
        loader: "ts-loader",
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
          "css-loader"
        ]
      },
      {
        test: /\.(png|svg|jpg|gif|html)$/,
        use: "file-loader"
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
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
    new CopyWebpackPlugin({
      patterns: [
        { from: "./*.html", to: "./", },
        { from: "**/*.png", to: "./img", context: "./" },
        // { from: "./styles", to: "./dist", context: "./" },
        { from: "./azure-devops-extension.json", to: "./azure-devops-extension.json" },
        { from: "./node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js", to: "./dist" },
        { from: "./node_modules/monaco-editor/min/vs/loader.js", to: "./monaco-editor/min/vs" },
        { from: "./node_modules/monaco-editor/min/vs/editor/", to: "./monaco-editor/min/vs/editor", context: "./"  },
        { from: "./node_modules/monaco-editor/min/vs/base/", to: "./monaco-editor/min/vs/base", context: "./" },
        { from: "./node_modules/monaco-editor/min/vs/basic-languages/", to: "./monaco-editor/min/vs/basic-languages", context: "./" }
      ]
    })
  ]
};