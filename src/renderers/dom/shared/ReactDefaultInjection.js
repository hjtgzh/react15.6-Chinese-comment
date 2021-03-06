/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDefaultInjection
 */

"use strict";

var ARIADOMPropertyConfig = require("ARIADOMPropertyConfig");
var BeforeInputEventPlugin = require("BeforeInputEventPlugin");
var ChangeEventPlugin = require("ChangeEventPlugin");
var DefaultEventPluginOrder = require("DefaultEventPluginOrder");
var EnterLeaveEventPlugin = require("EnterLeaveEventPlugin");
var HTMLDOMPropertyConfig = require("HTMLDOMPropertyConfig");
var ReactComponentBrowserEnvironment = require("ReactComponentBrowserEnvironment");
var ReactDOMComponent = require("ReactDOMComponent");
var ReactDOMComponentTree = require("ReactDOMComponentTree");
var ReactDOMEmptyComponent = require("ReactDOMEmptyComponent");
var ReactDOMTreeTraversal = require("ReactDOMTreeTraversal");
var ReactDOMTextComponent = require("ReactDOMTextComponent");
var ReactDefaultBatchingStrategy = require("ReactDefaultBatchingStrategy");
var ReactEventListener = require("ReactEventListener");
var ReactInjection = require("ReactInjection");
var ReactReconcileTransaction = require("ReactReconcileTransaction");
var SVGDOMPropertyConfig = require("SVGDOMPropertyConfig");
var SelectEventPlugin = require("SelectEventPlugin");
var SimpleEventPlugin = require("SimpleEventPlugin");

var alreadyInjected = false;

// 这里会被 ReactDOM 模块调用，初始化所有注入
// 调用 ReactInjection 模块对象的方法
function inject() {
  if (alreadyInjected) {
    // TODO: This is currently true because these injections are shared between
    // the client and the server package. They should be built independently
    // and not share any injection state. Then this problem will be solved.
    return;
  }
  alreadyInjected = true;

  ReactInjection.EventEmitter.injectReactEventListener(ReactEventListener);

  /**
   * Inject modules for resolving DOM hierarchy and plugin ordering.
   */
  ReactInjection.EventPluginHub.injectEventPluginOrder(DefaultEventPluginOrder);
  ReactInjection.EventPluginUtils.injectComponentTree(ReactDOMComponentTree);
  ReactInjection.EventPluginUtils.injectTreeTraversal(ReactDOMTreeTraversal);

  /**
   * Some important event plugins included by default (without having to require
   * them).
   */
  ReactInjection.EventPluginHub.injectEventPluginsByName({
    SimpleEventPlugin: SimpleEventPlugin,
    EnterLeaveEventPlugin: EnterLeaveEventPlugin,
    ChangeEventPlugin: ChangeEventPlugin,
    SelectEventPlugin: SelectEventPlugin,
    BeforeInputEventPlugin: BeforeInputEventPlugin,
  });

  ReactInjection.HostComponent.injectGenericComponentClass(ReactDOMComponent);

  ReactInjection.HostComponent.injectTextComponentClass(ReactDOMTextComponent);

  ReactInjection.DOMProperty.injectDOMPropertyConfig(ARIADOMPropertyConfig);
  ReactInjection.DOMProperty.injectDOMPropertyConfig(HTMLDOMPropertyConfig);
  ReactInjection.DOMProperty.injectDOMPropertyConfig(SVGDOMPropertyConfig);

  ReactInjection.EmptyComponent.injectEmptyComponentFactory(function (
    instantiate
  ) {
    return new ReactDOMEmptyComponent(instantiate);
  });

  // 实际调用 ReactUpdates 模块的两个方法
  // 分别注入 ReactReconcileTransaction 和 ReactDefaultBatchingStrategy 两个模块
  ReactInjection.Updates.injectReconcileTransaction(ReactReconcileTransaction);
  ReactInjection.Updates.injectBatchingStrategy(ReactDefaultBatchingStrategy);

  // 实际调用 ReactInjection.Component 指向的是 ReactComponentEnvironment 模块的 injection 对象
  // 调用了对象的 injectEnvironment 方法，
  // 将 ReactComponentBrowserEnvironment 模块对象的 processChildrenUpdates 和 replaceNodeWithMarkup 属性值赋值给了
  // ReactComponentEnvironment 模块对象的 processChildrenUpdates 和 replaceNodeWithMarkup 属性
  ReactInjection.Component.injectEnvironment(ReactComponentBrowserEnvironment);
}

module.exports = {
  inject: inject,
};
