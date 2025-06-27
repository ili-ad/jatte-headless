"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DragAndDropContainer = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var DragAndDropContainer = function (_a) {
    var children = _a.children, className = _a.className, draggable = _a.draggable, onSetNewOrder = _a.onSetNewOrder;
    var _b = (0, react_1.useState)([]), order = _b[0], setOrder = _b[1];
    var _c = (0, react_1.useState)(null), dragStartIndex = _c[0], setDragStartIndex = _c[1];
    var _d = (0, react_1.useState)(null), dragOverIndex = _d[0], setDragOverIndex = _d[1];
    var _e = (0, react_1.useState)(null), container = _e[0], setContainer = _e[1];
    var moveDirection = dragStartIndex === null || dragOverIndex === null
        ? undefined
        : dragStartIndex <= dragOverIndex
            ? 'down'
            : 'up';
    var childrenArray = react_1.default.Children.toArray(children);
    (0, react_1.useEffect)(function () {
        setOrder(react_1.default.Children.map(children, function (_, index) { return index; }) || []);
    }, [children]);
    (0, react_1.useEffect)(function () {
        if (!container)
            return;
        var handleDragStart = function (e) {
            var _a, _b;
            var target = e.target;
            var draggableItem = target.closest('.str-chat__drag-and-drop-container__item');
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move';
            }
            if (draggableItem instanceof HTMLElement) {
                var index = Array.from(((_a = draggableItem.parentElement) === null || _a === void 0 ? void 0 : _a.children) || []).indexOf(draggableItem);
                setDragStartIndex(index);
                (_b = e.dataTransfer) === null || _b === void 0 ? void 0 : _b.setData('text/plain', index.toString());
                draggableItem.style.opacity = '0.3';
            }
        };
        var handleDragOver = function (e) {
            var _a;
            e.preventDefault();
            var target = e.target;
            var draggableItem = target.closest('.str-chat__drag-and-drop-container__item');
            if (draggableItem instanceof HTMLElement) {
                var index = Array.from(((_a = draggableItem.parentElement) === null || _a === void 0 ? void 0 : _a.children) || []).indexOf(draggableItem);
                setDragOverIndex(index);
            }
        };
        var handleDragLeave = function () {
            setDragOverIndex(null);
        };
        var handleDrop = function (e) {
            var _a, _b;
            e.preventDefault();
            var draggedIndex = parseInt(((_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.getData('text/plain')) || '-1', 10);
            var target = e.target;
            var draggableItem = target.closest('.str-chat__drag-and-drop-container__item');
            if (draggableItem instanceof HTMLElement) {
                var dropIndex_1 = Array.from(((_b = draggableItem.parentElement) === null || _b === void 0 ? void 0 : _b.children) || []).indexOf(draggableItem);
                if (draggedIndex !== -1 && draggedIndex !== dropIndex_1) {
                    setOrder(function (prevOrder) {
                        var newOrder = __spreadArray([], prevOrder, true);
                        var removed = newOrder.splice(draggedIndex, 1)[0];
                        newOrder.splice(dropIndex_1, 0, removed);
                        onSetNewOrder === null || onSetNewOrder === void 0 ? void 0 : onSetNewOrder(newOrder);
                        return newOrder;
                    });
                }
            }
            setDragStartIndex(null);
            setDragOverIndex(null);
        };
        var handleDragEnd = function (e) {
            var target = e.target;
            if (target instanceof HTMLElement) {
                target.style.opacity = '';
            }
            setDragStartIndex(null);
            setDragOverIndex(null);
        };
        container.addEventListener('dragstart', handleDragStart);
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('dragleave', handleDragLeave);
        container.addEventListener('drop', handleDrop);
        container.addEventListener('dragend', handleDragEnd);
        return function () {
            container.removeEventListener('dragstart', handleDragStart);
            container.removeEventListener('dragover', handleDragOver);
            container.removeEventListener('dragleave', handleDragLeave);
            container.removeEventListener('drop', handleDrop);
            container.removeEventListener('dragend', handleDragEnd);
        };
    }, [container, onSetNewOrder]);
    return (<div className={(0, clsx_1.default)('str-chat__drag-and-drop-container', className)} ref={setContainer}>
      {order.map(function (originalIndex, currentIndex) {
            var child = childrenArray[originalIndex];
            return (<div className={(0, clsx_1.default)('str-chat__drag-and-drop-container__item', {
                    'str-chat__drag-and-drop-container__item--dragged-over-from-bottom': moveDirection === 'up' && dragOverIndex === currentIndex,
                    'str-chat__drag-and-drop-container__item--dragged-over-from-top': moveDirection === 'down' && dragOverIndex === currentIndex,
                })} draggable={draggable} key={react_1.default.isValidElement(child) ? child.key : "draggable-item-".concat(originalIndex)}>
            {child}
          </div>);
        })}
    </div>);
};
exports.DragAndDropContainer = DragAndDropContainer;
