"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
exports.Log = Log;
const fs = __importStar(require("fs"));
const md5_1 = __importDefault(require("md5"));
class Utils {
    static readFromJsonFile(file) {
        try {
            let data = fs.readFileSync(file, 'utf-8');
            return JSON.parse(data.toString());
        }
        catch (error) {
            console.log('file: ' + file + ' not exist!', error);
        }
    }
    static saveToJsonFile(file, obj) {
        try {
            let data = JSON.stringify(obj);
            fs.writeFileSync(file, data);
        }
        catch (error) {
            console.log('file: ' + file + ' not exist!', error);
        }
    }
    static getReadableFileSize(size) {
        return size > 1024 ? (size / 1024).toFixed(2) + 'KB' : size + 'B';
    }
    static toObjectFromMap(map) {
        let obj = {};
        for (let [key, value] of map) {
            obj[key] = value;
        }
        return obj;
    }
    static toMapFromObject(obj) {
        let map = new Map();
        for (let key in obj) {
            map.set(key, obj[key]);
        }
        return map;
    }
    static md5value(file) {
        let data = fs.readFileSync(file);
        return (0, md5_1.default)(data);
    }
}
exports.Utils = Utils;
const PACKAGE_NAME = 'cc-compress-img';
function Log(...args) {
    console.log(`[${PACKAGE_NAME}]`, ...args);
    // if (Editor && Editor["log"]) {
    //     Editor["log"](`[${PACKAGE_NAME}]`, ...args)
    // } else {
    //     console.log(`[${PACKAGE_NAME}]`, ...args)
    // }
}
