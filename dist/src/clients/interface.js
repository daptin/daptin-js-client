"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var InMemoryLocalStorage = /** @class */ (function () {
    function InMemoryLocalStorage() {
    }
    InMemoryLocalStorage.prototype.getItem = function (key) {
        return this.data[key];
    };
    InMemoryLocalStorage.prototype.setItem = function (key, value) {
        this.data[key] = value;
    };
    return InMemoryLocalStorage;
}());
exports.InMemoryLocalStorage = InMemoryLocalStorage;
