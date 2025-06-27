"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
describe('MessageComposer', function () {
    test('set text, add attachment and reset', function () {
        var mc = new index_1.MessageComposer();
        mc.setText('hello');
        mc.addAttachment({ id: 'a1' });
        expect(mc.state.text).toBe('hello');
        expect(mc.state.attachments).toEqual([{ id: 'a1' }]);
        mc.reset();
        expect(mc.state.text).toBe('');
        expect(mc.state.attachments).toEqual([]);
    });
    test('attachment manager adds files', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mc, file, list;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mc = new index_1.MessageComposer();
                    file = new File(['x'], 'a.txt', { type: 'text/plain' });
                    return [4 /*yield*/, mc.attachmentManager.addFiles([file])];
                case 1:
                    _a.sent();
                    list = mc.attachmentManager.state.getLatestValue().attachments;
                    expect(list.length).toBe(1);
                    return [2 /*return*/];
            }
        });
    }); });
    test('link previews manager stores fetched previews', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mc, map;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    global.fetch = jest.fn().mockResolvedValue({
                        json: function () { return Promise.resolve({ url: 'http://x', title: 'X' }); },
                    });
                    mc = new index_1.MessageComposer();
                    return [4 /*yield*/, mc.linkPreviewsManager.add('http://x')];
                case 1:
                    _a.sent();
                    map = mc.linkPreviewsManager.state.getLatestValue().previews;
                    expect(map.get('http://x')).toEqual({ url: 'http://x', title: 'X' });
                    return [2 /*return*/];
            }
        });
    }); });
});
