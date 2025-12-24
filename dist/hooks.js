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
exports.onError = exports.onAfterBuild = exports.onBeforeBuild = exports.unload = exports.load = exports.throwError = void 0;
const path_1 = __importDefault(require("path"));
const pngquant_1 = require("./pngquant");
const utils_1 = require("./utils");
const tinypng_1 = require("./tinypng");
const PACKAGE_NAME = 'cc-compress-img';
// let allAssets = [];
exports.throwError = true;
const load = function () {
    return __awaiter(this, void 0, void 0, function* () {
        (0, utils_1.Log)(`压缩图片插件加载成功`);
        // allAssets = await Editor.Message.request('asset-db', 'query-assets');
    });
};
exports.load = load;
const unload = function () {
    return __awaiter(this, void 0, void 0, function* () {
        (0, utils_1.Log)(`压缩图片插件卸载成功`);
    });
};
exports.unload = unload;
const onBeforeBuild = function (options, result) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, utils_1.Log)(`onBeforeBuild: ${options.platform}`);
    });
};
exports.onBeforeBuild = onBeforeBuild;
// export const onBeforeCompressSettings: BuildHook.onBeforeCompressSettings = async function (options: ITaskOptions, result: IBuildResult) {
//     console.debug('get settings test', result.settings);
// };
//
// export const onAfterCompressSettings: BuildHook.onAfterCompressSettings = async function (options: ITaskOptions, result: IBuildResult) {
// };
const onAfterBuild = function (options, result) {
    return __awaiter(this, void 0, void 0, function* () {
        const pkgOptions = options.packages[PACKAGE_NAME];
        if (pkgOptions.enable) {
            const pluginPath = yield Editor.Package.getPath(PACKAGE_NAME);
            (0, utils_1.Log)("onAfterBuild: 插件路径", pluginPath);
            (0, utils_1.Log)("onAfterBuild: 开始压缩图片...");
            const ignore_uuids = pkgOptions.filters.split('\n');
            let ignore_assets = [];
            for (const uuid of ignore_uuids) {
                const items = result.getRawAssetPaths(uuid);
                items.forEach(item => {
                    item.raw.forEach(p => ignore_assets.push(path_1.default.basename(p)));
                });
            }
            (0, utils_1.Log)("onAfterBuild: 忽略压缩资源", ignore_assets);
            const enableCache = pkgOptions.enableCache;
            (0, utils_1.Log)("onAfterBuild: 是否启用图库缓存", enableCache);
            const toolType = pkgOptions.toolType;
            (0, utils_1.Log)("onAfterBuild: 压缩工具类型", toolType);
            const concurrency = pkgOptions.concurrency;
            (0, utils_1.Log)("onAfterBuild: 压缩并发数", concurrency);
            let enableRemoteCache = pkgOptions.enableRemoteCache;
            (0, utils_1.Log)("onAfterBuild: 是否启用远程缓存", enableRemoteCache);
            const machinePlatform = process.platform;
            if (machinePlatform == 'win32') {
                // windows
            }
            else if (machinePlatform == 'darwin') {
                // macos
                enableRemoteCache = false;
            }
            else if (machinePlatform == 'linux') {
            }
            const server_url = "//192.168.80.10/3研发/cache_imgs";
            const cacheDirPath = enableRemoteCache ? server_url : path_1.default.join(Editor.Project.path, 'cache_imgs');
            if (toolType === 'tinypng') {
                let tool = new tinypng_1.Tinypng();
                yield tool.init();
                yield tool.compress({
                    compressRootDir: result.dest,
                    ignoreImgs: ignore_assets,
                    cacheEnable: enableCache,
                    cacheDirPath: path_1.default.join(cacheDirPath, 'tinypng'),
                    concurrency: concurrency,
                });
            }
            else if (toolType === 'pngquant') {
                let tool = new pngquant_1.Pngquant();
                tool.init({
                    pluginRootPath: pluginPath,
                });
                yield tool.compress({
                    compressRootDir: result.dest,
                    ignoreImgs: ignore_assets,
                    cacheEnable: enableCache,
                    cacheDirPath: path_1.default.join(cacheDirPath, 'pngquant'),
                    concurrency: concurrency,
                });
            }
        }
        else {
            (0, utils_1.Log)('onAfterBuild: 跳过图片压缩');
        }
    });
};
exports.onAfterBuild = onAfterBuild;
const onError = function (options, result) {
    return __awaiter(this, void 0, void 0, function* () {
        // Todo some thing
        console.warn(`${PACKAGE_NAME} run onError`);
    });
};
exports.onError = onError;
// export const onBeforeMake: BuildHook.onBeforeMake = async function (root, options) {
//     console.log(`onBeforeMake: root: ${root}, options: ${options}`);
// };
//
// export const onAfterMake: BuildHook.onAfterMake = async function (root, options) {
//     console.log(`onAfterMake: root: ${root}, options: ${options}`);
// };
