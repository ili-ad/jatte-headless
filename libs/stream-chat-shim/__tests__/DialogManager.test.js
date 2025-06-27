"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DialogManager_1 = require("../src/DialogManager");
describe('DialogManager shim', function () {
    it('throws when open is called', function () {
        var dm = new DialogManager_1.DialogManager();
        expect(function () { return dm.open({ id: 'test' }); }).toThrow('DialogManager.open not implemented');
    });
});
