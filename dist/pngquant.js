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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pngquant = void 0;
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const ICompressHander_1 = require("./ICompressHander");
let pngquantCommandline = "static/pngquant/pngquant.exe";
class Pngquant extends ICompressHander_1.ICompressHandler {
    constructor() {
        super(...arguments);
        this.commandLine = '';
        // 1 - 10 值越小越慢
        this.compressSpeed = 1;
        this.qualityMin = 65;
        this.qualityMax = 80;
    }
    init(options) {
        const pluginRootPath = options.pluginRootPath;
        if (process.platform === 'win32') {
            pngquantCommandline = 'static/pngquant/win32/pngquant.exe';
        }
        else if (process.platform === 'darwin') {
            pngquantCommandline = 'static/pngquant/macos/pngquant';
        }
        this.commandLine = path_1.default.join(pluginRootPath, pngquantCommandline);
        for (const key in options) {
            if (options[key] != null && this[key] != null) {
                this[key] = options[key];
            }
        }
    }
    cmdline(filePath, outputPath) {
        return this.commandLine + ` ${filePath} --output ${outputPath} --skip-if-larger --force --speed ${this.compressSpeed} --quality=${this.qualityMin}-${this.qualityMax}`;
    }
    compressImg(filePath, outputPath) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                (0, child_process_1.exec)(this.cmdline(filePath, outputPath), (error, stdout, stderr) => {
                    if (error) {
                        // console.warn("压缩失败:", error)
                        return resolve(false);
                    }
                    return resolve(true);
                });
            });
        });
    }
}
exports.Pngquant = Pngquant;
