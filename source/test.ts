import { Pngquant } from "./pngquant"
import { Tinypng } from "./tinypng"
import path from 'path';
import fs from 'fs';

// 要压缩图片的根目录
const IMG_SOURCE_DIR = "D:\\workspace\\cocos_game\\work\\avatar_img";
// 压缩后的图片输出目录，如果为空则覆盖源图片
const IMG_OUTPUT_DIR = ""
// 缓存目录
const IMG_CACHE_DIR = path.join(__dirname, "../cache_img")
// 0 pngquant 1 tinypng
let USE_TOOL_TYPE = 0;

(async () => {
    if (!fs.existsSync(IMG_SOURCE_DIR)) {
        console.error("img source dir not exist: ", IMG_SOURCE_DIR)
        return;
    }

    console.info("start compress images...")
    if (USE_TOOL_TYPE == 0) {
        let binaryPath = ""
        if (process.platform === "win32") {
            binaryPath = path.join(__dirname, "../static/pngquant/win32/pngquant.exe")
        } else if (process.platform === "darwin") {
            binaryPath = path.join(__dirname, "../static/pngquant/macos/pngquant")
        }
        const tool1 = new Pngquant()
        tool1.init({ pluginRootPath: binaryPath })
        tool1.compress({
            compressRootDir: IMG_SOURCE_DIR,
            // outputDir: outputDir,
            cacheDirPath: IMG_CACHE_DIR,
            cacheEnable: false,
            concurrency: 30,
        })
    } else if (USE_TOOL_TYPE == 1) {
        const tool = new Tinypng()
        await tool.init()
        await tool.compress({
            compressRootDir: IMG_SOURCE_DIR,
            outputDir: IMG_SOURCE_DIR,
            cacheDirPath: IMG_CACHE_DIR,
            cacheEnable: true,
            concurrency: 30,
        })
    }
    console.info("compress images finish.")
})()
