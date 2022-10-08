"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
exports.__esModule = true;
exports.CAPY_COUNT = exports.BOARD_WIDTH = exports.deploy = void 0;
var snarkyjs_1 = require("snarkyjs");
var tictoc_1 = require("./tictoc");
await snarkyjs_1.isReady;
exports.BOARD_WIDTH = 7;
exports.CAPY_COUNT = 10;
var Board = /** @class */ (function (_super) {
    __extends(Board, _super);
    function Board(value) {
        var _this = _super.call(this) || this;
        _this.value = value.map(function (row) { return row.map(snarkyjs_1.Field); });
        return _this;
    }
    Board.prototype.hash = function () {
        return snarkyjs_1.Poseidon.hash(this.value.flat());
    };
    __decorate([
        (0, snarkyjs_1.matrixProp)(snarkyjs_1.Field, exports.BOARD_WIDTH, exports.BOARD_WIDTH)
    ], Board.prototype, "value");
    return Board;
}(snarkyjs_1.CircuitValue));
var SudokuZkapp = /** @class */ (function (_super) {
    __extends(SudokuZkapp, _super);
    function SudokuZkapp() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.commitment1 = (0, snarkyjs_1.State)();
        _this.commitment2 = (0, snarkyjs_1.State)();
        return _this;
    }
    SudokuZkapp.prototype.setBoard1 = function (boardInstance) {
        this.commitment2.assertEquals((0, snarkyjs_1.Field)(0));
        var board = boardInstance.value;
        var sum = (0, snarkyjs_1.Field)(0);
        for (var i = 0; i < exports.BOARD_WIDTH; i++) {
            for (var j = 0; j < exports.BOARD_WIDTH; j++) {
                sum = sum.add(board[i][j]);
            }
        }
        sum.assertEquals(exports.CAPY_COUNT);
        this.commitment1.set(boardInstance.hash());
    };
    SudokuZkapp.prototype.setBoard2 = function (boardInstance) {
        this.commitment2.assertEquals((0, snarkyjs_1.Field)(0));
        var board = boardInstance.value;
        var sum = (0, snarkyjs_1.Field)(0);
        for (var i = 0; i < exports.BOARD_WIDTH; i++) {
            for (var j = 0; j < exports.BOARD_WIDTH; j++) {
                sum = sum.add(board[i][j]);
            }
        }
        sum.assertEquals(exports.CAPY_COUNT);
        this.commitment2.set(boardInstance.hash());
    };
    __decorate([
        (0, snarkyjs_1.state)(snarkyjs_1.Field)
    ], SudokuZkapp.prototype, "commitment1");
    __decorate([
        (0, snarkyjs_1.state)(snarkyjs_1.Field)
    ], SudokuZkapp.prototype, "commitment2");
    __decorate([
        snarkyjs_1.method
    ], SudokuZkapp.prototype, "setBoard1");
    __decorate([
        snarkyjs_1.method
    ], SudokuZkapp.prototype, "setBoard2");
    return SudokuZkapp;
}(snarkyjs_1.SmartContract));
// setup
var Local = snarkyjs_1.Mina.LocalBlockchain();
snarkyjs_1.Mina.setActiveInstance(Local);
var feePayer = Local.testAccounts[0].privateKey;
var isDeploying = null;
function deploy() {
    return __awaiter(this, void 0, void 0, function () {
        var zkappKey, zkappAddress, verificationKey, zkappInterface, zkapp, tx;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (isDeploying)
                        return [2 /*return*/, isDeploying];
                    zkappKey = snarkyjs_1.PrivateKey.random();
                    zkappAddress = zkappKey.toPublicKey();
                    (0, tictoc_1.tic)('compile');
                    return [4 /*yield*/, SudokuZkapp.compile()];
                case 1:
                    verificationKey = (_a.sent()).verificationKey;
                    (0, tictoc_1.toc)();
                    zkappInterface = {
                        setBoard1: function (board) {
                            return setBoard1(zkappAddress, board);
                        },
                        getState: function () {
                            return getState(zkappAddress);
                        }
                    };
                    zkapp = new SudokuZkapp(zkappAddress);
                    return [4 /*yield*/, snarkyjs_1.Mina.transaction(feePayer, function () {
                            snarkyjs_1.AccountUpdate.fundNewAccount(feePayer);
                            zkapp.deploy({ zkappKey: zkappKey, verificationKey: verificationKey });
                        })];
                case 2:
                    tx = _a.sent();
                    return [4 /*yield*/, tx.send().wait()];
                case 3:
                    _a.sent();
                    isDeploying = null;
                    return [2 /*return*/, zkappInterface];
            }
        });
    });
}
exports.deploy = deploy;
function setBoard1(zkappAddress, sudoku) {
    return __awaiter(this, void 0, void 0, function () {
        var zkapp, tx, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    zkapp = new SudokuZkapp(zkappAddress);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, snarkyjs_1.Mina.transaction(feePayer, function () {
                            zkapp.setBoard1(new Board(sudoku));
                        })];
                case 2:
                    tx = _a.sent();
                    (0, tictoc_1.tic)('prove');
                    return [4 /*yield*/, tx.prove()];
                case 3:
                    _a.sent();
                    (0, tictoc_1.toc)();
                    return [4 /*yield*/, tx.send().wait()];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    console.log('Solution rejected!');
                    console.error(err_1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function getState(zkappAddress) {
    var zkapp = new SudokuZkapp(zkappAddress);
    return {};
}
