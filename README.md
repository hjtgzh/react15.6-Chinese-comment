<!--
 * @文件描述: readme.md文件
 * @公司: thundersdata
 * @作者: 黄建停
 * @Date: 2020-04-10 09:30:55
 * @LastEditors: 黄建停
 * @LastEditTime: 2020-04-24 09:25:36
 -->
# [React](https://facebook.github.io/react/)15.6版本 源码中文注解

## React 源码的组织结构如下：
![avatar](/imgs/mulu.png)

* **addons:** 包含一系列的工具方法插件，如 PureRenderMixin 、 CSSTransitionGroup 、 Fragment 、
LinkedStateMixin 等。
* **isomorphic:** 包含一系列同构方法。
* **shared:** 包含一些公用或常用方法，如 PooledClass 等。
* **renderers:** 是 React 代码的核心部分，它包含了大部分功能实现。renderers 分为 dom 和 shared 等目录。
  * **dom:** 包含 client、server 和 shared。
    * **client:** 包含 DOM 操作方法（如 findDOMNode 、 setInnerHTML 、 setTextContent 等）以及事件方法，结构如图 3-2 所示。这里的事件方法主要是一些非底层的实用性事件方法，如事件监听（ ReactEventListener ）、常用事件方法（ TapEventPlugin 、 EnterLeave-EventPlugin ）以及一些合成事件（ SyntheticEvents 等）。
    ![avatar](/imgs/renderers.png)
    * **server:** 主要包含服务端渲染的实现和方法（如ReactServerRendering 、 ReactServer-RenderingTransaction 等）。
    * **shared:** 包含文本组件（ReactDOMTextComponent）、标签组件（ReactDOMComponent）、DOM 属性操作（ DOMProperty 、 DOMPropertyOperations ）、CSS 属性操作（ CSSProperty 、CSSPropertyOperations ）等。
  * **shared:** 包含 event 和 reconciler。
    * **event:** 包含一些更为底层的事件方法，如事件插件中心（ EventPluginHub ）、事件注册（ EventPluginRegistry ）、事件传播（ EventPropagators ）以及一些事件通用方法。React 自定义了一套通用事件的插件系统，该系统包含事件监听器、事件发射器、事件插件中心、点击事件、进/出事件、简单事件、合成事件以及一些事件方法，如图 3-3所示。
    ![avatar](/imgs/event.png)
    * **reconciler:** 称为协调器，它是最为核心的部分，包含 React 中自定义组件的实现（ReactCompositeComponent）、组件生命周期机制、setState 机制（ReactUpdates、ReactUpdateQueue）、DOM diff 算法（ReactMultiChild）等重要的特性方法。
* **test:** 包含一些测试方法等。

## React 使用了 Grunt，Gulp，browserify 以及 npm scripts 来构建
内部自定义的模块系统，所有文件名是全局唯一的。（具体实现操作都在gulpfile.js文件里面）

react 源码中的外部依赖很少，一般如果在 src 目录下找不到一个文件，可以去 fbjs 的 npm 包中查找。然而，在 react 的入口文件 ReactEntry.js 中就看到了一个外部依赖包 object-assign。而且，react 自己写了个 babel-plugin , 在 scripts/babel/transform-object-assign-require 目录，将 Object.assign 转换为 require('object-assign')。

## 官方案例

We have several examples [on the website](https://facebook.github.io/react/). Here is the first one to get you started:

```js
class HelloMessage extends React.Component {
  render() {
    return <div>Hello {this.props.name}</div>;
  }
}

ReactDOM.render(
  <HelloMessage name="John" />,
  document.getElementById('container')
);
```

This example will render "Hello John" into a container on the page.

You'll notice that we used an HTML-like syntax; [we call it JSX](https://facebook.github.io/react/docs/introducing-jsx.html). JSX is not required to use React, but it makes code more readable, and writing it feels like writing HTML. We recommend using [Babel](https://babeljs.io/) with a [React preset](https://babeljs.io/docs/plugins/preset-react/) to convert JSX into native JavaScript for browsers to digest.

