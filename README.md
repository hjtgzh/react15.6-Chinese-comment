<!--
 * @文件描述: readme.md文件
 * @公司: thundersdata
 * @作者: 黄建停
 * @Date: 2020-04-10 09:30:55
 * @LastEditors: 黄建停
 * @LastEditTime: 2020-04-23 22:25:39
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

## Examples

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

## Installation

React is available as the `react` package on [npm](https://www.npmjs.com/). It is also available on a [CDN](https://facebook.github.io/react/docs/installation.html#using-a-cdn).

React is flexible and can be used in a variety of projects. You can create new apps with it, but you can also gradually introduce it into an existing codebase without doing a rewrite.

The recommended way to install React depends on your project. Here you can find short guides for the most common scenarios:

* [Trying Out React](https://facebook.github.io/react/docs/installation.html#trying-out-react)
* [Creating a Single Page Application](https://facebook.github.io/react/docs/installation.html#creating-a-single-page-application)
* [Adding React to an Existing Application](https://facebook.github.io/react/docs/installation.html#adding-react-to-an-existing-application)

## Contributing

The main purpose of this repository is to continue to evolve React core, making it faster and easier to use. If you're interested in helping with that, check out our [contribution guide](https://facebook.github.io/react/contributing/how-to-contribute.html).

### [Code of Conduct](https://code.facebook.com/codeofconduct)

Facebook has adopted a Code of Conduct that we expect project participants to adhere to. Please read [the full text](https://code.facebook.com/codeofconduct) so that you can understand what actions will and will not be tolerated.

### Good First Bug

To help you get your feet wet and get you familiar with our contribution process, we have a list of [good first bugs](https://github.com/facebook/react/labels/good%20first%20bug) that contain bugs which are fairly easy to fix. This is a great place to get started.

### License

React is [BSD licensed](./LICENSE). We also provide an additional [patent grant](./PATENTS).

React documentation is [Creative Commons licensed](./LICENSE-docs).

Examples provided in this repository and in the documentation are [separately licensed](./LICENSE-examples).

## Troubleshooting
See the [Troubleshooting Guide](https://github.com/facebook/react/wiki/Troubleshooting)
