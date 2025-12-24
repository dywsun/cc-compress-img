import path from 'path'
import { exec } from 'child_process'
import { ICompressHandler } from './ICompressHander'

let pngquantCommandline = "static/pngquant/pngquant.exe"

export interface IPngquantOptions {
    pluginRootPath: string
    compressSpeed?: number
    qualityMin?: number
    qualityMax?: number
}

export class Pngquant extends ICompressHandler {
    commandLine: string = ''
    // 1 - 10 值越小越慢
    private compressSpeed: number = 1
    private qualityMin: number = 65
    private qualityMax: number = 80

    init(options: IPngquantOptions) {
        const pluginRootPath = options.pluginRootPath
        if (process.platform === 'win32') {
            pngquantCommandline = 'static/pngquant/win32/pngquant.exe'
        } else if (process.platform === 'darwin') {
            pngquantCommandline = 'static/pngquant/macos/pngquant'
        }
        this.commandLine = path.join(pluginRootPath, pngquantCommandline)
        for (const key in options) {
            if (options[key] != null && this[key] != null) {
                this[key] = options[key]
            }
        }
    }

    private cmdline(filePath: string, outputPath: string) {
        return this.commandLine + ` ${filePath} --output ${outputPath} --skip-if-larger --force --speed ${this.compressSpeed} --quality=${this.qualityMin}-${this.qualityMax}`
    }

    protected async compressImg(filePath: string, outputPath: string):
        Promise<boolean> {

        return await new Promise((resolve, reject) => {
            exec(this.cmdline(filePath, outputPath), (error, stdout, stderr) => {
                if (error) {
                    // console.warn("压缩失败:", error)
                    return resolve(false);
                }
                return resolve(true);
            });
        })
    }
}

