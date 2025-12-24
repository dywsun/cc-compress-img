import path from "path";
import fs from 'fs';

function copyDirectory(src: string, dest: string) {
    fs.mkdirSync(dest, { recursive: true }); // 创建目标目录，如果不存在
    const files = fs.readdirSync(src);

    for (const file of files) {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);

        if (fs.statSync(srcPath).isDirectory()) {
            copyDirectory(srcPath, destPath); // 递归复制子目录
        } else {
            fs.copyFileSync(srcPath, destPath); // 复制文件
        }
    }
}

export function toggleSDK(
    projectPath: string,
    packageName: string,
    version: string
) {
    const sdkResPath = path.join(projectPath, "sdk_res", packageName)

    // const sdkPath = path.join(projectPath, "assets/usecase1")
    console.info(sdkResPath)
    const isMiniGamePlatform = true;
    if (isMiniGamePlatform) {

        // 1. json 文件
        const jsonDir = path.join(projectPath, "assets/resources/json")
        if (!fs.existsSync(jsonDir)) {
            fs.mkdirSync(jsonDir, { recursive: true });
        }
        const src1 = path.join(sdkResPath, "gameConfig.json")
        const dest = path.join(jsonDir, "gameConfig.json")
        if (!fs.existsSync(src1)) {
            console.error(`文件不存在: ${src1}`)
            return false;
        }
        fs.copyFileSync(src1, dest)

        // sdklibs
        const sdklibsDir = path.join(projectPath, "assets/SDKlibs")
        fs.rmdirSync(sdklibsDir, { recursive: true });
        copyDirectory(path.join(sdkResPath, "SDKlibs"), sdklibsDir)

        // SDKResources
        const SDKResourcesDir = path.join(projectPath, "assets/resources/SDKResources")
        fs.rmdirSync(SDKResourcesDir, { recursive: true });
        copyDirectory(path.join(sdkResPath, "SDKResources"), SDKResourcesDir)

        // minigameSDK.d.ts
        const declarefile = path.join(projectPath, "assets/minigameSDK.d.ts")
        const src = path.join(sdkResPath, "minigameSDK.d.ts")
        fs.copyFileSync(src, declarefile)
    }
}
