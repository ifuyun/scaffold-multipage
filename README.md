Gulp+Webpack多页系统方案脚手架
===

# 前置条件
1. Node.js
2. [Ruby](http://www.ruby-lang.org/en/downloads/)

**注1：Less无需安装Ruby、compass。**

**注2：采用node-sass模块（安装不稳定）的也无需安装Ruby、compass。**

# 环境配置
```bash
gem install compass
```

```bash
npm i -g gulp
npm i -g webpack
npm i
```

# 运行
## 开发
**注：服务+监听**

```bash
npm run dev
```
或

```bash
gulp dev --env development
```
或

```bash
gulp --env development
```

## 测试（本地模拟打包后的环境）
**注：build+服务**

```bash
npm run online
```
或

```bash
gulp online
```

## 构建
### 当前目录构建（用于本地测试）
```bash
npm run build
```
或

```bash
gulp build
```

### 发布构建（用于提测）
```bash
npm run release
```
或

```bash
gulp release
```

# 开发说明
## 开发技术栈

* Webpack：模块化+ES6转码
* Gulp：开发、打包等工程化工具
* Sass/Less
* EJS：HTML模板
* ES6

## JS部分
需在模块js文件前引入公共JS文件：

```js
<script type="text/javascript" src="/js/common.js"></script>
```
路径引用方式：

```js
<script type="text/javascript" src="/js/xxx/xxx.js"></script>
```
## CSS部分
通过以下方式定义（在build块内的多个css文件将合并成一个）：

```html
<!-- build:css /style/css/xxx.css -->
<link type="text/css" rel="stylesheet" href="/style/css/xxx.css"></style>
<!-- endbuild -->
```
## HTML部分
通过以下方式引入公共模板文件：

```html
<% include ../partials/header.ejs %>
```

## Mock
模拟数据文件在```dev/mock```，子目录路径+文件名对应ajax的URL，ajax地址前缀配置通过```config-gulp.json```中的```ajaxPrefix```设置，即：以该前缀开头的URL将匹配mock下的模拟数据文件进行返回。