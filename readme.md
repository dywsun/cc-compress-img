# cc-compress-img

一个`cocos creator `构建插件，在`cocos creator`构建时提供自动压缩图片功能，功能如下：

1.有两个压缩工具可选

* `pngquant`（压缩次数无限制）

* `tinypng`（熊猫压缩 压缩次数有限制。需要API KEY，默认提供了一些免费的）

2.提供缓存机制，无需每次重新压缩

3.可以通过填写图片的UUID来忽略跳过压缩该图片，支持多个填写(一行一个UUID)

4.可指定共享的文件服务路径



## 基本使用流程

* cocos编辑器导入该插件。

- 插件模板内使用了一些 `node` 模块方法，目前在 `packages.json` 内添加了插件支持的模块 `types`，安装后才能正常编译通过以及得到更好的类型提示。

```bash
    npm install
```

* 另外也可用直接在node环境下运行(可在`dist/test.js`脚本中修改参数)
  ``` bash
  node dist/test.js
  ```

  
