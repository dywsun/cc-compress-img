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
exports.doCompress = doCompress;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const utils_1 = require("./utils");
const pngquantCommandline = "static/pngquant/pngquant.exe";
let CacheDirPath = '';
let CompressCommandLine = '';
const ImgPostfixInclude = ['.png', '.jpg'];
let MD5Records = new Map();
// 1 - 10 值越小越慢
const CompressSpeed = 1;
let compressionInfo = {
    total: 0,
    finish: 0
};
function initCache() {
    const imgCacheDir = path_1.default.join(CacheDirPath, 'img/');
    if (!fs_1.default.existsSync(imgCacheDir)) {
        fs_1.default.mkdirSync(imgCacheDir, { recursive: true });
    }
    const md5RecordFile = path_1.default.join(CacheDirPath, 'MD5Records.json');
    if (fs_1.default.existsSync(md5RecordFile)) {
        const records = utils_1.Utils.readFromJsonFile(md5RecordFile);
        MD5Records = utils_1.Utils.toMapFromObject(records);
        const allCacheFiles = Array.from(MD5Records.values());
        for (const file of allCacheFiles) {
            const cacheFile = path_1.default.join(CacheDirPath, file);
            if (!fs_1.default.existsSync(cacheFile)) {
                MD5Records.delete(file);
            }
        }
    }
}
function clearCache() {
    fs_1.default.rmdirSync(CacheDirPath, { recursive: true });
}
function saveCacheRecord(item) {
    if (MD5Records.has(item.md5)) {
        return;
    }
    const imgCacheName = new Date().getTime() + item.extname;
    const imgCachePath = path_1.default.join(CacheDirPath, 'img/', imgCacheName);
    fs_1.default.copyFileSync(item.compressedPath, imgCachePath);
    MD5Records.set(item.md5, imgCacheName);
    const md5RecordFile = path_1.default.join(CacheDirPath, 'MD5Records.json');
    utils_1.Utils.saveToJsonFile(md5RecordFile, utils_1.Utils.toObjectFromMap(MD5Records));
}
function readFile(filePath, fileList) {
    const files = fs_1.default.readdirSync(filePath);
    files.forEach((filename) => {
        const fileFullPath = path_1.default.join(filePath, filename);
        const extname = path_1.default.extname(fileFullPath);
        const stats = fs_1.default.statSync(fileFullPath);
        if (stats.isFile()) {
            if (!ImgPostfixInclude.includes(extname))
                return;
            const input = path_1.default.resolve(fileFullPath);
            const output = input;
            let md5Value = utils_1.Utils.md5value(fileFullPath);
            const item = {
                size: stats.size,
                name: filename,
                path: fileFullPath,
                md5: md5Value,
                compressedPath: output,
                extname: extname
            };
            fileList.push(item);
        }
        else if (stats.isDirectory()) {
            readFile(fileFullPath, fileList);
        }
    });
}
function getFileList(filePath) {
    let fileList = [];
    readFile(filePath, fileList);
    return fileList;
}
function getReadableFileSize(size) {
    return size > 1024 ? (size / 1024).toFixed(2) + 'KB' : size + 'B';
}
function printCompressInfo(item) {
    console.log(item.name, `压缩百分比: ${((item.size - item.compressedSize) / item.size * 100).toFixed(2)}% (${getReadableFileSize(item.size)} -> ${getReadableFileSize(item.compressedSize)})`);
}
function output(list) {
    let totalSize = 0;
    let totalCompressedSize = 0;
    list.forEach((item) => {
        if (item.compressedSize == undefined) {
        }
        else if (item.compressedSize > 0) {
            totalSize += item.size;
            totalCompressedSize += item.compressedSize;
        }
    });
    let compressionPercent = '0%';
    if (totalSize != 0)
        compressionPercent = ((totalSize - totalCompressedSize) / totalSize * 100).toFixed(2) + '%';
    console.log(`压缩图片总数: ${compressionInfo.finish}/${compressionInfo.total}, 压缩前总体积: ${getReadableFileSize(totalSize)}, 压缩后总体积: ${getReadableFileSize(totalCompressedSize)}, 压缩比: ${compressionPercent}`);
}
function doCompressPerImg(item) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            let command = CompressCommandLine + ` ${item.path} --output ${item.compressedPath} --skip-if-larger --force --speed ${CompressSpeed} --quality=65-80`;
            // console.info(command)
            (0, child_process_1.exec)(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`压缩失败: ${item.path}`);
                    return resolve(false);
                }
                ++compressionInfo.finish;
                item.compressedSize = fs_1.default.statSync(item.compressedPath).size;
                // printCompressInfo(item)
                console.log(`压缩进度: ${(compressionInfo.finish / compressionInfo.total * 100).toFixed(2)}% (${compressionInfo.finish}/${compressionInfo.total})`);
                return resolve(true);
            });
        });
    });
}
function doCompressImg(compressionList) {
    return __awaiter(this, void 0, void 0, function* () {
        const imgCacheDir = path_1.default.join(CacheDirPath, 'img/');
        for (const item of compressionList) {
            // 本次压缩有可能出现相同的图片, 可以减少重复压缩
            if (MD5Records.has(item.md5)) {
                const cacheFile = path_1.default.join(imgCacheDir, MD5Records.get(item.md5));
                fs_1.default.copyFileSync(cacheFile, item.compressedPath);
                item.compressedSize = fs_1.default.statSync(item.compressedPath).size;
                ++compressionInfo.finish;
                continue;
            }
            if (yield doCompressPerImg(item)) {
                // 缓存图片
                saveCacheRecord(item);
            }
        }
        output(compressionList);
    });
}
function doCompress(pluginRootPath_1, compressDirPath_1) {
    return __awaiter(this, arguments, void 0, function* (pluginRootPath, compressDirPath, ignoreFiles = [], enableCache = true) {
        // console.log('compress dir path: ', path.resolve(compressDirPath))
        CompressCommandLine = path_1.default.join(pluginRootPath, pngquantCommandline);
        CacheDirPath = path_1.default.join(compressDirPath, '../../cache_imgs/pngquant');
        if (!fs_1.default.existsSync(CacheDirPath)) {
            fs_1.default.mkdirSync(CacheDirPath, { recursive: true });
        }
        // console.log('cache dir path: ', CacheDirPath, CompressCommandLine)
        initCache();
        let fileList = getFileList(compressDirPath);
        console.log('待压缩文件数: ', fileList.length);
        fileList = fileList.filter((item) => ignoreFiles.indexOf(item.name) == -1);
        console.log('待压缩文件数(过滤): ', fileList.length);
        if (enableCache) {
            const fileListCache = fileList.filter((item) => MD5Records.has(item.md5));
            if (fileListCache.length > 0) {
                const imgCacheDir = path_1.default.join(CacheDirPath, 'img/');
                console.log(`从缓存库中直接拷贝图片: ${fileListCache.length}`);
                for (const item of fileListCache) {
                    const cacheFile = path_1.default.join(imgCacheDir, MD5Records.get(item.md5));
                    fs_1.default.copyFileSync(cacheFile, item.compressedPath);
                    item.compressedSize = fs_1.default.statSync(item.compressedPath).size;
                    // printCompressInfo(item)
                }
            }
            fileList = fileList.filter((item) => !MD5Records.has(item.md5));
        }
        console.log('最终待压缩文件数: ', fileList.length);
        compressionInfo.total = fileList.length;
        compressionInfo.finish = 0;
        // console.log('command line path: ', CompressCommandLine)
        yield doCompressImg(fileList);
    });
}
