import fs from 'fs';
import path from 'path';
import { Log, Utils } from './utils';

export interface CompressParams {
    compressRootDir: string;
    cacheDirPath: string;
    outputDir?: string;
    ignoreImgs?: string[];
    cacheEnable: boolean;
    imgPostfixInclude?: string[];
    concurrency?: number;
    extra?: any;
}

export class CompressEntry {
    // 图片绝对路径
    filePath: string;
    // 图片名(带扩展名)
    fileName: string;
    // 图片原始大小
    size: number;
    // md5值
    md5: string;
    // 输出绝对路径
    outputPath: string;
    // 扩展名
    extname: string;
    // 压缩后大小
    compressedSize: number;
    // 是否压缩成功
    compressSuccess: boolean;
}

export async function concurrentTaskRunner<T>(
    taskFns: Array<() => Promise<T>>,
    limit: number
): Promise<T[]> {
    if (limit <= 0) {
        return Promise.reject(new Error("Concurrency limit must be positive."));
    }

    // 1. 初始化
    const totalTasks = taskFns.length;
    if (totalTasks === 0) {
        return Promise.resolve([]);
    }

    const results: T[] = new Array(totalTasks);
    let taskIndex = 0; // 下一个要启动的任务在 taskFns 里的索引

    // 2. 创建主 Promise，用于等待所有任务完成
    return new Promise((resolve, reject) => {
        let finishedCount = 0; // 已完成的任务数量 (成功或失败)
        let activeCount = 0; // 正在运行的任务数量

        // 任务处理函数：负责启动任务和替补调度
        const runNextTask = () => {
            // A. 检查是否还有任务需要启动
            if (activeCount >= limit || taskIndex >= totalTasks) {
                return;
            }

            // B. 取出任务信息
            const currentTaskFn = taskFns[taskIndex];
            const currentIndex = taskIndex;
            taskIndex++; // 索引立即前移，为下一个替补任务做准备
            activeCount++;

            // C. 启动任务
            currentTaskFn()
                .then(result => {
                    results[currentIndex] = result;
                })
                .catch(error => {
                    console.error(`Task ${currentIndex} failed:`, error);
                    // 如果需要立即中断
                    // reject(error);
                })
                .finally(() => {
                    // D. 任务完成，计数器增加
                    finishedCount++;
                    activeCount--;

                    // E. 检查是否所有任务都已完成
                    if (finishedCount === totalTasks) {
                        // 所有任务都已完成，主 Promise 解析
                        resolve(results);
                    } else {
                        // F. 替补：递归调用 runNextTask 来启动下一个任务
                        // (只要还有未启动的任务，就会继续启动)
                        runNextTask();
                    }
                });
        };

        // 3. 启动初始的 m 个任务
        const initialTasksToRun = Math.min(totalTasks, limit);
        for (let i = 0; i < initialTasksToRun; i++) {
            runNextTask();
        }
    });
}

// 将要压缩的所有图片
export class ICompressHandler {
    protected compressEntrys: CompressEntry[] = [];
    // 压缩输出根目录
    protected outputDir: string = "";
    protected cacheDirPath: string = "";
    protected imgPostfixInclude: string[] = [".png", ".jpg"];
    protected cacheEnable: boolean = true;
    protected ignoreImgs: string[] = [];
    // 并发压缩数
    protected concurrency: number = 30;

    protected md5Records: Map<string, string> = new Map();

    // md5 -> CompressEntry[]
    protected entryMap: Map<string, CompressEntry[]> = new Map();

    protected initCache() {
        this.md5Records.clear()
        const files = fs.readdirSync(this.cacheDirPath)
        for (const filename of files) {
            const md5 = path.basename(filename, path.extname(filename))
            const filePath = path.join(this.cacheDirPath, filename)
            this.md5Records.set(md5, filePath)
        }
        // Log('cache inited', this.md5Records)
    }

    protected saveCacheRecord(entry: CompressEntry) {
        const md5 = entry.md5
        const outputPath = entry.outputPath
        const filename = path.join(this.cacheDirPath, md5 + entry.extname)
        if (!this.md5Records.has(md5)) {
            fs.copyFileSync(outputPath, filename)
            this.md5Records.set(md5, filename)
        }
    }

    protected getCompressEntry(filePath: string, entrylist: CompressEntry[]) {
        const files = fs.readdirSync(filePath)
        for (const filename of files) {
            const fileFullPath = path.join(filePath, filename)
            const extname = path.extname(fileFullPath)
            const stats = fs.statSync(fileFullPath)
            if (stats.isFile()) {
                if (!this.imgPostfixInclude.includes(extname)) {
                    continue;
                }
                const md5Value = Utils.md5value(fileFullPath)
                const outputPath = this.outputDir ? path.join(this.outputDir, filename) : fileFullPath
                const entry = {
                    filePath: fileFullPath,
                    fileName: filename,
                    size: stats.size,
                    md5: md5Value,
                    outputPath: outputPath,
                    extname: extname,
                    compressedSize: 0,
                    compressSuccess: false
                }
                entrylist.push(entry)
            } else {
                this.getCompressEntry(fileFullPath, entrylist)
            }
        }
    }

    async compress(params: CompressParams) {
        Log('开始压缩...', params)
        const rootDir = params.compressRootDir
        this.cacheDirPath = params.cacheDirPath
        if (params.imgPostfixInclude) {
            this.imgPostfixInclude = params.imgPostfixInclude
        }
        if (params.outputDir) this.outputDir = params.outputDir
        if (params.ignoreImgs) this.ignoreImgs = params.ignoreImgs
        if (params.cacheEnable != null) this.cacheEnable = params.cacheEnable
        if (params.concurrency) this.concurrency = params.concurrency
        this.compressEntrys.length = 0

        let now = new Date().getTime()
        this.getCompressEntry(rootDir, this.compressEntrys)
        Log(`获取待压缩文件列表完成,耗时(ms): ${new Date().getTime() - now} ms`)
        Log('待压缩文件数: ', this.compressEntrys.length)
        this.compressEntrys = this.compressEntrys.filter((entry) => this.ignoreImgs.indexOf(entry.fileName) === -1)
        Log('待压缩文件数(排除忽略项): ', this.compressEntrys.length)

        // 把内容相同的图片分组，可以减少一些重复压缩
        this.entryMap.clear()
        for (const entry of this.compressEntrys) {
            const md5 = entry.md5
            if (this.entryMap.has(md5)) {
                this.entryMap.get(md5).push(entry)
            } else {
                this.entryMap.set(md5, [entry])
            }
        }
        Log('去重后待压缩文件数: ', this.entryMap.size)
        const compressEntrys = Array.from(this.entryMap.values()).map(entrys => entrys[0])

        if (!fs.existsSync(this.cacheDirPath)) {
            fs.mkdirSync(this.cacheDirPath, { recursive: true })
        }
        if (this.outputDir && !fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true })
        }

        if (this.cacheEnable) {
            this.initCache()
        }
        let imgsFromCache = []
        let imgsToCompress = []
        for (const entry of compressEntrys) {
            if (this.cacheEnable && this.md5Records.has(entry.md5)) {
                imgsFromCache.push(entry)
            } else {
                imgsToCompress.push(entry)
            }
        }
        Log("最终待压缩文件数(排除从缓存库中提取): ", imgsToCompress.length)

        // 先从缓存中获取已压缩过的图片
        now = new Date().getTime()
        for (const entry of imgsFromCache) {
            const cacheImgPath = this.md5Records.get(entry.md5)
            fs.copyFileSync(cacheImgPath, entry.outputPath)
            entry.compressSuccess = true
        }
        Log(`从缓存库中提取图片完成,耗时(ms): ${new Date().getTime() - now} ms`)

        if (imgsToCompress.length > 0) {
            now = new Date().getTime()
            await this.doCompressN(imgsToCompress)
            const successCount = imgsToCompress.filter(entry => entry.compressSuccess).length
            Log(`压缩完成: ${successCount}/${imgsToCompress.length}, 耗时: ${new Date().getTime() - now} ms`)
        }
        // 将压缩结果复制到输出路径
        for (const entry of imgsToCompress) {
            if (!entry.compressSuccess) continue;
            const outputPath = entry.outputPath
            const cacheImgPath = this.md5Records.get(entry.md5)
            fs.copyFileSync(cacheImgPath, outputPath)
        }

        now = new Date().getTime()
        for (const entry of compressEntrys) {
            if (!entry.compressSuccess) continue;

            // 记录压缩大小
            const outputPath = entry.outputPath
            const size = fs.statSync(outputPath).size
            entry.compressedSize = size
            const arr = this.entryMap.get(entry.md5)

            // 将重复的图片拷贝压缩后的图片
            if (arr.length > 1) {
                for (let i = 1; i < arr.length; i++) {
                    const otherEntry = arr[i]
                    fs.copyFileSync(outputPath, otherEntry.outputPath)
                    otherEntry.compressedSize = size
                    otherEntry.compressSuccess = true
                }
            }
        }
        Log(`记录压缩体积耗时: ${new Date().getTime() - now}ms`)

        Log("从缓存库中提取图片完成,共计: ", imgsFromCache.length)
        this.printCompressInfo(this.compressEntrys)
    }

    protected async doCompressN(imgsToCompress: CompressEntry[]) {
        let compressCount = 0
        const compressTasks = imgsToCompress.map((entry) => {
            return async () => {
                // 先将压缩结果保存到缓存目录
                const cacheImgPath = path.join(this.cacheDirPath, entry.md5 + entry.extname)
                const success = await this.compressImg(entry.filePath, cacheImgPath)
                if (success) {
                    this.md5Records.set(entry.md5, cacheImgPath)
                    entry.compressSuccess = true
                    ++compressCount
                    if (compressCount % 100 === 0) {
                        Log(`压缩进度: ${compressCount}/${imgsToCompress.length}`)
                    }
                }
            }

        })
        await concurrentTaskRunner(compressTasks, this.concurrency)
    }

    protected printCompressInfo(entrys: CompressEntry[]) {
        let totalSize = 0
        let totalCompressedSize = 0
        let successCount = 0
        for (const entry of entrys) {
            if (entry.compressSuccess && entry.compressedSize > 0) {
                ++successCount
                totalSize += entry.size
                totalCompressedSize += entry.compressedSize
            }
        }
        const c = Utils.getReadableFileSize(totalCompressedSize)
        const t = Utils.getReadableFileSize(totalSize)
        const percent = totalSize == 0 ? 0 : Math.floor((totalSize - totalCompressedSize) / totalSize * 10000) / 100
        Log(`压缩完成: ${successCount}/${entrys.length}, 压缩率: ${t}=>${c} (${percent}%)`)
    }

    protected async compressImg(filePath: string, outputPath: string): Promise<boolean> {
        return true
    }
}

