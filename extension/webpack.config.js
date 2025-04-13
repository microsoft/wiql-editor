const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const TerserPlugin = require('terser-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');


module.exports = {
  mode: "development",
  target: "web",
  entry: {
    playground: "./scripts/wiqlPlayground/playground.ts",
    queryContext: "./scripts/queryContext/queryContext.ts",
    queryEditor: "./scripts/queryEditor/queryEditor.ts"

  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
          keep_fnames: true
        }
      })
    ]
  },
  output: {
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
    "monaco": true,
  },
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
      {
        test: /\.tsx?$/, 
        loader: "ts-loader",
        options: {
       transpileOnly: true,// - should help with HMR
        },
      },
      {
        test:  /\.s[ac]ss$/i, 
        use: [
          "sass-loader",
          "css-loader",
          "style-loader",
        ]
      },
      {
        test: /\.css$/,
        use: [
          "style-loader", 
          "css-loader",
          "azure-devops-ui/buildScripts/css-variables-loader",
        
        ]
      },
      {
        test: /\.(png|svg|jpg|gif|html)$/,
        use: "file-loader"
      },
     
      {
       
    test: /\.ttf$/,
        use: [
          {
            loader: 'file-loader',
          }
        ]
      }
    ]
  },
  plugins: [
   
    new MonacoWebpackPlugin(),
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
        { from: "../LICENSE", to: "../LICENSE" },
        { from: "./azure-devops-extension.json", to: "./azure-devops-extension.json" },
        { from: "./node_modules/azure-devops-extension-sdk/SDK.min.js", to: "./" },
      ]
    })
  ]
};


