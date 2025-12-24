import path from 'path';
import { IBuildTaskOption, BuildHook, IBuildResult } from '../@types';
import { Pngquant } from './pngquant';
import { Log } from './utils';
import { Tinypng } from './tinypng';

interface IOptions {
    remoteAddress: string;
    enterCocos: string;
    selectTest: string;
    objectTest: {
        number: number;
        string: string;
        boolean: boolean
    },
    arrayTest: [number, string, boolean];
}

const PACKAGE_NAME = 'cc-compress-img';

interface ITaskOptions extends IBuildTaskOption {
    packages: {
        'cocos-plugin-template': IOptions;
    };
}

// let allAssets = [];

export const throwError: BuildHook.throwError = true;

export const load: BuildHook.load = async function () {
    Log(`压缩图片插件加载成功`);
    // allAssets = await Editor.Message.request('asset-db', 'query-assets');
};

export const unload: BuildHook.unload = async function () {
    Log(`压缩图片插件卸载成功`);
};

export const onBeforeBuild: BuildHook.onBeforeBuild = async function (options: ITaskOptions, result: IBuildResult) {
    Log(`onBeforeBuild: ${options.platform}`)
};

// export const onBeforeCompressSettings: BuildHook.onBeforeCompressSettings = async function (options: ITaskOptions, result: IBuildResult) {
//     console.debug('get settings test', result.settings);
// };
//
// export const onAfterCompressSettings: BuildHook.onAfterCompressSettings = async function (options: ITaskOptions, result: IBuildResult) {
// };

export const onAfterBuild: BuildHook.onAfterBuild = async function (options: ITaskOptions, result: IBuildResult) {
    const pkgOptions = options.packages[PACKAGE_NAME];
    if (pkgOptions.enable) {
        const pluginPath = await Editor.Package.getPath(PACKAGE_NAME)
        Log("onAfterBuild: 插件路径", pluginPath)
        Log("onAfterBuild: 开始压缩图片...")
        const ignore_uuids = pkgOptions.filters.split('\n')
        let ignore_assets = []
        for (const uuid of ignore_uuids) {
            const items = result.getRawAssetPaths(uuid)
            items.forEach(item => {
                item.raw.forEach(p => ignore_assets.push(path.basename(p)))
            })
        }
        Log("onAfterBuild: 忽略压缩资源", ignore_assets)
        const enableCache = pkgOptions.enableCache
        Log("onAfterBuild: 是否启用图库缓存", enableCache)
        const toolType = pkgOptions.toolType
        Log("onAfterBuild: 压缩工具类型", toolType)
        const concurrency = pkgOptions.concurrency
        Log("onAfterBuild: 压缩并发数", concurrency)
        let enableRemoteCache = pkgOptions.enableRemoteCache
        Log("onAfterBuild: 是否启用远程缓存", enableRemoteCache)
        const machinePlatform = process.platform
        if (machinePlatform == 'win32') {
            // windows
        } else if (machinePlatform == 'darwin') {
            // macos
            enableRemoteCache = false
        } else if (machinePlatform == 'linux') {
        }
        const server_url = "//192.168.80.10/3研发/cache_imgs"
        const cacheDirPath = enableRemoteCache ? server_url : path.join(Editor.Project.path, 'cache_imgs')

        if (toolType === 'tinypng') {
            let tool = new Tinypng()
            await tool.init()
            await tool.compress({
                compressRootDir: result.dest,
                ignoreImgs: ignore_assets,
                cacheEnable: enableCache,
                cacheDirPath: path.join(cacheDirPath, 'tinypng'),
                concurrency: concurrency,
            })
        } else if (toolType === 'pngquant') {
            let tool = new Pngquant()
            tool.init({
                pluginRootPath: pluginPath,
            })
            await tool.compress({
                compressRootDir: result.dest,
                ignoreImgs: ignore_assets,
                cacheEnable: enableCache,
                cacheDirPath: path.join(cacheDirPath, 'pngquant'),
                concurrency: concurrency,
            })
        }
    } else {
        Log('onAfterBuild: 跳过图片压缩')
    }
};

export const onError: BuildHook.onError = async function (options, result) {
    // Todo some thing
    console.warn(`${PACKAGE_NAME} run onError`);
};

// export const onBeforeMake: BuildHook.onBeforeMake = async function (root, options) {
//     console.log(`onBeforeMake: root: ${root}, options: ${options}`);
// };
//
// export const onAfterMake: BuildHook.onAfterMake = async function (root, options) {
//     console.log(`onAfterMake: root: ${root}, options: ${options}`);
// };
