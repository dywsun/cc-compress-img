"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleSDK = toggleSDK;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function copyDirectory(src, dest) {
    fs_1.default.mkdirSync(dest, { recursive: true }); // 创建目标目录，如果不存在
    const files = fs_1.default.readdirSync(src);
    for (const file of files) {
        const srcPath = path_1.default.join(src, file);
        const destPath = path_1.default.join(dest, file);
        if (fs_1.default.statSync(srcPath).isDirectory()) {
            copyDirectory(srcPath, destPath); // 递归复制子目录
        }
        else {
            fs_1.default.copyFileSync(srcPath, destPath); // 复制文件
        }
    }
}
function toggleSDK(projectPath, packageName, version) {
    const sdkResPath = path_1.default.join(projectPath, "sdk_res", packageName);
    // const sdkPath = path.join(projectPath, "assets/usecase1")
    console.info(sdkResPath);
    const isMiniGamePlatform = true;
    if (isMiniGamePlatform) {
        // 1. json 文件
        const jsonDir = path_1.default.join(projectPath, "assets/resources/json");
        if (!fs_1.default.existsSync(jsonDir)) {
            fs_1.default.mkdirSync(jsonDir, { recursive: true });
        }
        const src1 = path_1.default.join(sdkResPath, "gameConfig.json");
        const dest = path_1.default.join(jsonDir, "gameConfig.json");
        if (!fs_1.default.existsSync(src1)) {
            console.error(`文件不存在: ${src1}`);
            return false;
        }
        fs_1.default.copyFileSync(src1, dest);
        // sdklibs
        const sdklibsDir = path_1.default.join(projectPath, "assets/SDKlibs");
        fs_1.default.rmdirSync(sdklibsDir, { recursive: true });
        copyDirectory(path_1.default.join(sdkResPath, "SDKlibs"), sdklibsDir);
        // SDKResources
        const SDKResourcesDir = path_1.default.join(projectPath, "assets/resources/SDKResources");
        fs_1.default.rmdirSync(SDKResourcesDir, { recursive: true });
        copyDirectory(path_1.default.join(sdkResPath, "SDKResources"), SDKResourcesDir);
        // minigameSDK.d.ts
        const declarefile = path_1.default.join(projectPath, "assets/minigameSDK.d.ts");
        const src = path_1.default.join(sdkResPath, "minigameSDK.d.ts");
        fs_1.default.copyFileSync(src, declarefile);
    }
}
