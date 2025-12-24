import { Log } from './utils'

import tinify from 'tinify'
import { CompressEntry, concurrentTaskRunner, ICompressHandler } from './ICompressHander'
import path from 'path'

const API_KEYS = [
    "fr1MmC0D2QVYRyXQM03RT0cRx0Zyt4qd",
    "YSwKspmwYlk72V2gWHPphCFD5vkCznDQ",
    "zj5RY8j0LTL3vS4KtM2g2tV5vsyhR0Jy",
    "xscH8jf0DSYBgJD1GvvbJgtfzFyQmdbx",
    "kcrk4zrwZCMjyRZHqz1qq68mS91HSJk0",
    "dLNVNSP8VQsztSg13F2l4p8Lxh7HH0HM",
    "fssbjqHXHS513SCd5h8Z5Q0P1VFSWFW0",
    "4CnHSbC6r2Gr97pdVTYmw0g4H7G09HRr",
    "jFfptT2XRY6vDgvcj5ZmpYNMy2LCKMHd",
    "xZ5PXRZp9PM7DkG33f4rLjXw2nM4xm33",
    "W1njKCWp4lYqj4MCspCdf23YpjV7WWJh",
    "dPt1Lft2zXSrDJCvhFYvyVqc8bhRh5jy",
    "1n46QBth3l3mMl0Njw2VknHkh0FfYMXB",
    "Yy3bcmnCt3FkbTGjKZtlBjc5bjYl2G4d",
    "w9FzSFZHz9RyCGzjBSJqrj1kCSgtRhG7",
    "TkWJ6pGB0kXvXMnhtwnBfSDpV31cdZ1k",
    "WScBkCSQZfPYp3kdxzHxYSSkC00hT5SS",
    "FnxDJ6xjDlpt76xCHgsWmP71LyRDLnPH",
    "5LXn0NRpYWygKHDQvyCtq5P67bG5LHbw",
    "jHv36q9qf0Lr820gWFLwlT1gPZtLj3py",
    "JgrcCHyhVRgkZHx5x9NsrHm4CrzRQNys",
    "8QwbXy4WcdwQPyFHb9B87gRb8SyW4sLQ",
    "Yv0r2QZYr1xxDdysJ89SQbgj0zVQXtk3",
    "jPVDyjY8RSJnrVmrp63lP7BJVmnBfBMx",
    "tgmPkwKvxmPYmW1JDpLPS2pMsDr4fNzp",
    "f4wnLdVHHsrg3StFWjTKbrx2bbFthvcC",
    "R9s6rr7rS8pMtzYqTTLjxJXwV0Kl5Hv8",
    "Gsl3PTm0w41gHG6jtD8TqgDZkqTK0fbz",
    "p8yqqrGDZ5fhLN2Q0M9ByVj4pJxLvMJb",
    "bb0rDQ1vXsB3hQD4fTwWJ7s6p0mKCZJ5",
    "gc97b2WsByw403fBdWgl1NTkc5YLCRCp",
    "NHGl8CgjWFPVN48KS86X46zDbqkf0MVk",
    "CM6bcmxyWFGTHRjFRqcLj8XG8Sv0CTgS",
    "2CVgvSX9VQvHkY5CNzjDbMGrStBcTs6f",
    "yz1CplFkydX8ckgmkq9nVLtzBvLnT1qF",
    "GYTy5Vq3dWWKklVcTkKDWnhlltNxKp1R",
    "yk7cb8PV2kcPq1Lx45JLhyJWytZK3HWC",
    "7NQndZcd3P2RGf4sVryWkcZcqxw8rDVh",
    "tKcrQ3Y5mRWhZplnldM1XPmqnQcW17s2",
    "zbpB7wKmmh8Xlb636wXsjrhbvXrTfPWM",
    "gVkNGcTPRCkksVMGk60F0cDNbWLfD4Tx",
    "k3BgSjwyY8cQwnBx4r6mXRnq6BWf6vMj",
    "7Tdmx7nHNd61bfs3dtBz7QRLDTBdSfrz",
    "0z1n4ZNMKT06SL4vRTPbdV9DT7SBsK37",
    "bVvkq3TpCqyGtW5nVPQz0SqhfYvhd0N0",
    "hhQQ4MqTpDsk3snWYXM4ST49v13M9Kkw",
]

export class Tinypng extends ICompressHandler {
    private static limitPerMonth = 500 // 单个API KEY每月压缩次数限制
    private validApiKeys: string[] = [];
    private remainCountMap: Map<string, number> = new Map();
    private curApiKeyIdx = -1;
    private curRemainCount = 0;
    // 当前能够使用的API KEY的剩余压缩次数
    private totalRemainCount = 0;

    async init(apiKeys?: string[]) {
        const keys = apiKeys ? apiKeys : API_KEYS
        this.validApiKeys = keys.slice()
    }

    async filterValidApiKeys(apiKeys: string[]) {
        this.remainCountMap.clear()
        let remainCount = 0;
        let validkeys: { apikey: string, remaining: number }[] = []
        for (const apiKey of apiKeys) {
            tinify.key = apiKey
            try {
                await tinify.validate()
                const remaining = Tinypng.limitPerMonth - tinify.compressionCount
                remainCount += remaining
                validkeys.push({
                    apikey: apiKey,
                    remaining: remaining
                })
                this.remainCountMap.set(apiKey, remaining)
            } catch (err) {
                Log('无效的API KEY: ', apiKey)
            }
        }
        this.totalRemainCount = remainCount
        // 优先使用次数最少的API KEY
        apiKeys.sort((a, b) => a.length - b.length)
        this.validApiKeys = validkeys.map(item => item.apikey)
        Log("有效账号数量:", validkeys.length)
        Log("所有账号本月总共剩余压缩次数:", remainCount)
    }

    private isLastApiKey() {
        return this.curApiKeyIdx == this.validApiKeys.length - 1
    }

    // 切换下一个可用API KEY
    private async switchNextApiKey() {
        if (this.isLastApiKey()) {
            return false;
        }

        this.curRemainCount = 0
        ++this.curApiKeyIdx
        const key = this.validApiKeys[this.curApiKeyIdx]
        tinify.key = key
        try {
            await tinify.validate()
        } catch (err) {
            Log('无效的API KEY: ', key)
            return await this.switchNextApiKey()
        }
        this.curRemainCount = Tinypng.limitPerMonth - tinify.compressionCount
        Log(`切换API KEY: ${key}, 剩余压缩次数: ${this.curRemainCount}`)
        if (this.curRemainCount <= 1) {
            return await this.switchNextApiKey()
        }

        return true;
    }

    private async checkCanCompress() {
        if (this.curRemainCount <= 1) {
            if (!await this.switchNextApiKey()) {
                return false
            }
        }
        return true;
    }

    private allEntrys: CompressEntry[] = []
    private compressCount = 0
    protected async doTinifyCompressN(cb?: () => void) {
        if (!await this.checkCanCompress()) {
            cb && cb()
            return;
        }
        let entrys = this.allEntrys.filter(entry => !entry.compressSuccess)
        if (entrys.length == 0) {
            return;
        }
        let finishedCount = 0
        const curCount = Math.min(entrys.length, this.curRemainCount - 1)
        entrys = entrys.slice(0, curCount)
        for (const entry of entrys) {
            // 优先将压缩后的图片存储到缓存库中
            const cacheImgPath = path.join(this.cacheDirPath, entry.md5 + entry.extname)
            tinify.fromFile(entry.filePath).toFile(cacheImgPath, (err) => {
                if (err) {
                    // 压缩失败，不做任何处理
                    console.warn(`压缩失败:`, err)
                } else {
                    this.md5Records.set(entry.md5, cacheImgPath)
                    entry.compressSuccess = true
                    ++this.compressCount
                    if (this.compressCount % 100 == 0) {
                        Log(`压缩进度: ${this.compressCount}/${this.allEntrys.length}`)
                    }
                }
                if (++finishedCount == curCount) {
                    this.curRemainCount -= curCount
                    // 当前这批压缩任务完成, 开始下一批
                    const needCompress = this.allEntrys.some(entry => !entry.compressSuccess)
                    console.info(`此批压缩任务完成(${curCount}), 是否开始下一批: ${needCompress}`)
                    if (needCompress) {
                        this.checkCanCompress().then((canCompress) => {
                            if (canCompress) {
                                this.doTinifyCompressN()
                            } else {
                                cb && cb()
                            }
                        })
                    } else {
                        cb && cb()
                    }
                }
            })
        }
    }

    protected async doCompressN(allEntrys: CompressEntry[]) {
        if (allEntrys.length == 0) {
            return;
        }

        return new Promise<void>((resolve) => {
            this.allEntrys = allEntrys
            this.compressCount = 0
            this.doTinifyCompressN(() => {
                resolve()
            })
        })
    }

}


