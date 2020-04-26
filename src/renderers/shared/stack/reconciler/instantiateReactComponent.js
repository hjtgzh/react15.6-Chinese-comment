/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule instantiateReactComponent
 */

"use strict";

var ReactCompositeComponent = require("ReactCompositeComponent");
var ReactEmptyComponent = require("ReactEmptyComponent");
var ReactHostComponent = require("ReactHostComponent");

var getNextDebugID = require("getNextDebugID");
var invariant = require("invariant");
var warning = require("warning");

// To avoid a cyclic dependency, we create the final class in this module
var ReactCompositeComponentWrapper = function (element) {
  this.construct(element);
};

function getDeclarationErrorAddendum(owner) {
  if (owner) {
    var name = owner.getName();
    if (name) {
      return " Check the render method of `" + name + "`.";
    }
  }
  return "";
}

/**
 * Check if the type reference is a known internal type. I.e. not a user
 * provided composite type.
 *
 * @param {function} type
 * @return {boolean} Returns true if this is a valid internal type.
 */
function isInternalComponentType(type) {
  return (
    typeof type === "function" &&
    typeof type.prototype !== "undefined" &&
    typeof type.prototype.mountComponent === "function" &&
    typeof type.prototype.receiveComponent === "function"
  );
}

/**
 * Given a ReactNode, create an instance that will actually be mounted.
 *
 * @param {ReactNode} node
 * @param {boolean} shouldHaveDebugID
 * @return {object} A new instance of the element's constructor.
 * @protected
 */
function instantiateReactComponent(node, shouldHaveDebugID) {
  var instance;

  if (node === null || node === false) {
    // 当 node 为空时，说明 node 不存在，则初始化空组件 ReactEmptyComponent.create(instantiateReactComponent)
    instance = ReactEmptyComponent.create(instantiateReactComponent);
    // 当 node 类型为对象时，即是 DOM 标签组件或自定义组件
  } else if (typeof node === "object") {
    var element = node;
    var type = element.type;
    if (typeof type !== "function" && typeof type !== "string") {
      var info = "";
      if (__DEV__) {
        if (
          type === undefined ||
          (typeof type === "object" &&
            type !== null &&
            Object.keys(type).length === 0)
        ) {
          info +=
            " You likely forgot to export your component from the file " +
            "it's defined in.";
        }
      }
      info += getDeclarationErrorAddendum(element._owner);
      invariant(
        false,
        "Element type is invalid: expected a string (for built-in components) " +
          "or a class/function (for composite components) but got: %s.%s",
        type == null ? type : typeof type,
        info
      );
    }

    // Special case string values
    // 如果 element 类型为字符串时，则初始化 DOM 标签组件
    if (typeof element.type === "string") {
      // ReactDOM 模块调用 ReactDefaultInjection 模块 inject 方法，初始化所有注入
      // 其中在 ReactHostComponent 模块，运行 injectGenericComponentClass 方法将 ReactDOMComponent 模块对象赋值给了 genericComponentClass
      // 运行 injectTextComponentClass 方法将 ReactDOMTextComponent 模块对象赋值给了 textComponentClass
      // ReactHostComponent.createInternalComponent 实际返回的是 ReactDOMComponent 模块对象
      instance = ReactHostComponent.createInternalComponent(element);
    } else if (isInternalComponentType(element.type)) {
      // This is temporarily available for custom components that are not string
      // representations. I.e. ART. Once those are updated to use the string
      // representation, we can drop this code path.
      // 不是字符串表示的自定义组件暂无法使用，此处将不做组件初始化操作
      instance = new element.type(element);

      // We renamed this. Allow the old name for compat. :(
      if (!instance.getHostNode) {
        instance.getHostNode = instance.getNativeNode;
      }
    } else {
      // 初始化自定义组件，返回的实例的原型对象包含 ReactCompositeComponent 模块对象
      instance = new ReactCompositeComponentWrapper(element);
    }
    // 当 node 类型为字符串或数字时，则初始化文本组件
  } else if (typeof node === "string" || typeof node === "number") {
    // 如上：运行 injectTextComponentClass 方法将 ReactDOMTextComponent 模块对象赋值给了 textComponentClass
    // ReactHostComponent.createInstanceForText 实际返回的是 ReactDOMTextComponent 模块对象
    // 当 node 类型为文本节点时是不算 Virtual DOM 元素的，但 React 为了保持渲染的一致性，将其封装为文本组件 ReactDOMTextComponent
    instance = ReactHostComponent.createInstanceForText(node);
  } else {
    invariant(false, "Encountered invalid React node of type %s", typeof node);
  }

  if (__DEV__) {
    warning(
      typeof instance.mountComponent === "function" &&
        typeof instance.receiveComponent === "function" &&
        typeof instance.getHostNode === "function" &&
        typeof instance.unmountComponent === "function",
      "Only React Components can be mounted."
    );
  }

  // These two fields are used by the DOM and ART diffing algorithms
  // respectively. Instead of using expandos on components, we should be
  // storing the state needed by the diffing algorithms elsewhere.
  instance._mountIndex = 0;
  instance._mountImage = null;

  if (__DEV__) {
    instance._debugID = shouldHaveDebugID ? getNextDebugID() : 0;
  }

  // Internal instances should fully constructed at this point, so they should
  // not get any new fields added to them at this point.
  if (__DEV__) {
    if (Object.preventExtensions) {
      Object.preventExtensions(instance);
    }
  }

  return instance;
}

// 将 ReactCompositeComponent 模块对象合并到 ReactCompositeComponentWrapper.prototype
Object.assign(
  ReactCompositeComponentWrapper.prototype,
  ReactCompositeComponent,
  {
    _instantiateReactComponent: instantiateReactComponent,
  }
);

module.exports = instantiateReactComponent;
