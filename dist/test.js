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
const pngquant_1 = require("./pngquant");
const tinypng_1 = require("./tinypng");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// 要压缩图片的根目录
const IMG_SOURCE_DIR = "D:\\workspace\\cocos_game\\avatar_img";
// 压缩后的图片输出目录，如果为空则覆盖源图片
const IMG_OUTPUT_DIR = "";
// 缓存目录
const IMG_CACHE_DIR = path_1.default.join(__dirname, "../cache_img");
// 0 pngquant 1 tinypng
let USE_TOOL_TYPE = 0;
(() => __awaiter(void 0, void 0, void 0, function* () {
    if (!fs_1.default.existsSync(IMG_SOURCE_DIR)) {
        console.error("img source dir not exist: ", IMG_SOURCE_DIR);
        return;
    }
    console.info("start compress images...");
    if (USE_TOOL_TYPE == 0) {
        const tool1 = new pngquant_1.Pngquant();
        tool1.init({ pluginRootPath: path_1.default.join(__dirname, "../") });
        tool1.compress({
            compressRootDir: IMG_SOURCE_DIR,
            // outputDir: outputDir,
            cacheDirPath: IMG_CACHE_DIR,
            cacheEnable: false,
            concurrency: 30,
        });
    }
    else if (USE_TOOL_TYPE == 1) {
        const tool = new tinypng_1.Tinypng();
        yield tool.init();
        yield tool.compress({
            compressRootDir: IMG_SOURCE_DIR,
            outputDir: IMG_SOURCE_DIR,
            cacheDirPath: IMG_CACHE_DIR,
            cacheEnable: true,
            concurrency: 30,
        });
    }
    console.info("compress images finish.");
}))();
