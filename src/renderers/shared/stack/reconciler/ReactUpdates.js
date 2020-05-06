/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactUpdates
 */

"use strict";

var CallbackQueue = require("CallbackQueue");
var PooledClass = require("PooledClass");
var ReactFeatureFlags = require("ReactFeatureFlags");
var ReactReconciler = require("ReactReconciler");
var Transaction = require("Transaction");

var invariant = require("invariant");

var dirtyComponents = [];
var updateBatchNumber = 0;
var asapCallbackQueue = CallbackQueue.getPooled();
var asapEnqueued = false;

var batchingStrategy = null;

function ensureInjected() {
  invariant(
    ReactUpdates.ReactReconcileTransaction && batchingStrategy,
    "ReactUpdates: must inject a reconcile transaction class and batching " +
      "strategy"
  );
}

var NESTED_UPDATES = {
  initialize: function () {
    this.dirtyComponentsLength = dirtyComponents.length;
  },
  close: function () {
    if (this.dirtyComponentsLength !== dirtyComponents.length) {
      // Additional updates were enqueued by componentDidUpdate handlers or
      // similar; before our own UPDATE_QUEUEING wrapper closes, we want to run
      // these new updates so that if A's componentDidUpdate calls setState on
      // B, B will update before the callback A's updater provided when calling
      // setState.
      // 此时 dirtyComponents 为新push进去的 component
      dirtyComponents.splice(0, this.dirtyComponentsLength);
      flushBatchedUpdates();
    } else {
      dirtyComponents.length = 0;
    }
  },
};

var UPDATE_QUEUEING = {
  initialize: function () {
    this.callbackQueue.reset();
  },
  close: function () {
    // 调用 CallbackQueue 组件实例的 notifyAll 方法，
    // 运行所有的 callbackQueue 属性 _callbacks 里面
    // 所有的 setState 的回调函数
    // 对应的 callbackQueue.enqueue 在 runBatchedUpdates 方法里
    this.callbackQueue.notifyAll();
  },
};

var TRANSACTION_WRAPPERS = [NESTED_UPDATES, UPDATE_QUEUEING];

// 批量处理 componentDidUpdate 的核心方法
function ReactUpdatesFlushTransaction() {
  this.reinitializeTransaction();
  this.dirtyComponentsLength = null;
  // CallbackQueue 组件实例赋值给 this.callbackQueue
  this.callbackQueue = CallbackQueue.getPooled();

  // 调用 ReactUpdates 模块 ReactReconcileTransaction 属性的 getPooled 的方法
  // 实际调用 ReactReconcileTransaction 模块的 getPooled 方法
  // 返回 ReactUpdates.ReactReconcileTransaction 的实例，即 ReactReconcileTransaction 的实例
  // 赋值给 reconcileTransaction
  this.reconcileTransaction = ReactUpdates.ReactReconcileTransaction.getPooled(
    /* useCreateElement */ true
  );
}

Object.assign(ReactUpdatesFlushTransaction.prototype, Transaction, {
  getTransactionWrappers: function () {
    return TRANSACTION_WRAPPERS;
  },

  destructor: function () {
    this.dirtyComponentsLength = null;
    CallbackQueue.release(this.callbackQueue);
    this.callbackQueue = null;
    ReactUpdates.ReactReconcileTransaction.release(this.reconcileTransaction);
    this.reconcileTransaction = null;
  },

  perform: function (method, scope, a) {
    // Essentially calls `this.reconcileTransaction.perform(method, scope, a)`
    // with this transaction's wrappers around it.

    // 相当于 this.reconcileTransaction.perform(method, scope, a)
    // 初始化存放 componentDidUpdate 的数组
    return Transaction.perform.call(
      this,
      this.reconcileTransaction.perform,
      this.reconcileTransaction,
      method, // runBatchedUpdates
      scope, // null
      a // transaction
    );
  },
});

PooledClass.addPoolingTo(ReactUpdatesFlushTransaction);

function batchedUpdates(callback, a, b, c, d, e) {
  ensureInjected();
  // 调用 ReactDefaultBatchingStrategy 的 batchedUpdates 方法
  return batchingStrategy.batchedUpdates(callback, a, b, c, d, e);
}

/**
 * Array comparator for ReactComponents by mount ordering.
 *
 * @param {ReactComponent} c1 first component you're comparing
 * @param {ReactComponent} c2 second component you're comparing
 * @return {number} Return value usable by Array.prototype.sort().
 */
function mountOrderComparator(c1, c2) {
  return c1._mountOrder - c2._mountOrder;
}

function runBatchedUpdates(transaction) {
  var len = transaction.dirtyComponentsLength;
  invariant(
    len === dirtyComponents.length,
    "Expected flush transaction's stored dirty-components length (%s) to " +
      "match dirty-components array length (%s).",
    len,
    dirtyComponents.length
  );

  // Since reconciling a component higher in the owner hierarchy usually (not
  // always -- see shouldComponentUpdate()) will reconcile children, reconcile
  // them before their children by sorting the array.
  dirtyComponents.sort(mountOrderComparator);

  // Any updates enqueued while reconciling must be performed after this entire
  // batch. Otherwise, if dirtyComponents is [A, B] where A has children B and
  // C, B could update twice in a single batch if C's render enqueues an update
  // to B (since B would have already updated, we should skip it, and the only
  // way we can know to do so is by checking the batch counter).
  updateBatchNumber++;

  for (var i = 0; i < len; i++) {
    // If a component is unmounted before pending changes apply, it will still
    // be here, but we assume that it has cleared its _pendingCallbacks and
    // that performUpdateIfNecessary is a noop.
    var component = dirtyComponents[i];

    // If performUpdateIfNecessary happens to enqueue any new updates, we
    // shouldn't execute the callbacks until the next render happens, so
    // stash the callbacks first
    var callbacks = component._pendingCallbacks;
    component._pendingCallbacks = null;

    var markerName;
    if (ReactFeatureFlags.logTopLevelRenders) {
      var namedComponent = component;
      // Duck type TopLevelWrapper. This is probably always true.
      if (component._currentElement.type.isReactTopLevelWrapper) {
        namedComponent = component._renderedComponent;
      }
      markerName = "React update: " + namedComponent.getName();
      console.time(markerName);
    }

    ReactReconciler.performUpdateIfNecessary(
      component,
      // 将参数 transaction 的属性 reconcileTransaction 即 ReactUpdatesFlushTransaction 实例的 reconcileTransaction 赋值给
      // ReactCompositeComponent 模块的 performUpdateIfNecessary 方法
      transaction.reconcileTransaction,
      updateBatchNumber
    );

    if (markerName) {
      console.timeEnd(markerName);
    }

    // 如果存放 setState 回调函数的 _pendingCallbacks 不为空，
    // 将 setState 的回调函数，放到 callbackQueue 里面
    // 在事务后面执行 callbackQueue.notifyAll
    if (callbacks) {
      for (var j = 0; j < callbacks.length; j++) {
        transaction.callbackQueue.enqueue(
          callbacks[j],
          component.getPublicInstance()
        );
      }
    }
  }
}

var flushBatchedUpdates = function () {
  // ReactUpdatesFlushTransaction's wrappers will clear the dirtyComponents
  // array and perform any updates enqueued by mount-ready handlers (i.e.,
  // componentDidUpdate) but we need to check here too in order to catch
  // updates enqueued by setState callbacks and asap calls.
  while (dirtyComponents.length || asapEnqueued) {
    if (dirtyComponents.length) {
      // 获取 ReactUpdatesFlushTransaction 实例
      var transaction = ReactUpdatesFlushTransaction.getPooled();
      // 实际执行的是上面 ReactUpdatesFlushTransaction 内部定义的 perform 方法
      transaction.perform(runBatchedUpdates, null, transaction);
      ReactUpdatesFlushTransaction.release(transaction);
    }

    if (asapEnqueued) {
      asapEnqueued = false;
      var queue = asapCallbackQueue;
      asapCallbackQueue = CallbackQueue.getPooled();
      queue.notifyAll();
      CallbackQueue.release(queue);
    }
  }
};

/**
 * Mark a component as needing a rerender, adding an optional callback to a
 * list of functions which will be executed once the rerender occurs.
 */
function enqueueUpdate(component) {
  ensureInjected();

  // Various parts of our code (such as ReactCompositeComponent's
  // _renderValidatedComponent) assume that calls to render aren't nested;
  // verify that that's the case. (This is called by each top-level update
  // function, like setState, forceUpdate, etc.; creation and
  // destruction of top-level components is guarded in ReactMount.)

  // 如果 isBatchingUpdates 为false，也就是没在事务中，则直接开启批量更新事务执行 enqueueUpdate
  /* 
    如果没在批量更新事务中调用 setState，
    则会在 enqueueUpdate 中用事务执行 enqueueUpdate，
    也就是执行完 dirtyComponents.push(component) 后事务就进入 close 阶段，
    接着就是执行flushBatchedUpdates 进行实际的组件更新，
    这时一次 setState 对应一次 flushBatchedUpdates。
    setState 的调用结束后，组件的 state 已经更新，整个过程并没有用到任何异步的 api
  */
  if (!batchingStrategy.isBatchingUpdates) {
    batchingStrategy.batchedUpdates(enqueueUpdate, component);
    return;
  }

  /* 
    如果调用 setState 的时候已经在批量更新事务的 method 中，
    则只是用把组件放入 dirtyComponents 列表中，
    等待批量更新事务中的 method 执行完毕后，才会执行 flushBatchedUpdates。
    这时多次调用 setState 只会执行一次 flushBatchedUpdates，也就是只会更新一次 update。
  */
  dirtyComponents.push(component);
  if (component._updateBatchNumber == null) {
    component._updateBatchNumber = updateBatchNumber + 1;
  }
}

/**
 * Enqueue a callback to be run at the end of the current batching cycle. Throws
 * if no updates are currently being performed.
 */
function asap(callback, context) {
  invariant(
    batchingStrategy.isBatchingUpdates,
    "ReactUpdates.asap: Can't enqueue an asap callback in a context where" +
      "updates are not being batched."
  );
  asapCallbackQueue.enqueue(callback, context);
  asapEnqueued = true;
}

// 这里会被 ReactInjection 模块的 Updates 方法调用
var ReactUpdatesInjection = {
  // 注入调节事务，即传入 ReactReconcileTransaction 模块
  injectReconcileTransaction: function (ReconcileTransaction) {
    invariant(
      ReconcileTransaction,
      "ReactUpdates: must provide a reconcile transaction class"
    );
    ReactUpdates.ReactReconcileTransaction = ReconcileTransaction;
  },

  // 注入分批策略，即传入 ReactDefaultBatchingStrategy 模块
  injectBatchingStrategy: function (_batchingStrategy) {
    invariant(
      _batchingStrategy,
      "ReactUpdates: must provide a batching strategy"
    );
    invariant(
      typeof _batchingStrategy.batchedUpdates === "function",
      "ReactUpdates: must provide a batchedUpdates() function"
    );
    invariant(
      typeof _batchingStrategy.isBatchingUpdates === "boolean",
      "ReactUpdates: must provide an isBatchingUpdates boolean attribute"
    );
    // 此时的 batchingStrategy 指向的是 ReactDefaultBatchingStrategy 模块
    batchingStrategy = _batchingStrategy;
  },
};

var ReactUpdates = {
  /**
   * React references `ReactReconcileTransaction` using this property in order
   * to allow dependency injection.
   *
   * @internal
   */
  ReactReconcileTransaction: null,

  batchedUpdates: batchedUpdates,
  enqueueUpdate: enqueueUpdate,
  flushBatchedUpdates: flushBatchedUpdates,
  injection: ReactUpdatesInjection,
  asap: asap,
};

module.exports = ReactUpdates;
