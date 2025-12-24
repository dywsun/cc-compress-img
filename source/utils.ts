import * as fs from 'fs'
import md5 from 'md5'
export class Utils {

    static readFromJsonFile(file: string) {
        try {
            let data = fs.readFileSync(file, 'utf-8')
            return JSON.parse(data.toString())
        } catch (error) {
            console.log('file: ' + file + ' not exist!', error)
        }
    }

    static saveToJsonFile(file: string, obj: any) {
        try {
            let data = JSON.stringify(obj)
            fs.writeFileSync(file, data)
        } catch (error) {
            console.log('file: ' + file + ' not exist!', error)
        }
    }

    static getReadableFileSize(size: number) {
        return size > 1024 ? (size / 1024).toFixed(2) + 'KB' : size + 'B'
    }

    static toObjectFromMap(map: Map<any, any>) {
        let obj = {}
        for (let [key, value] of map) {
            obj[key] = value
        }
        return obj
    }

    static toMapFromObject(obj: any) {
        let map = new Map()
        for (let key in obj) {
            map.set(key, obj[key])
        }
        return map
    }

    static md5value(file: string) {
        let data = fs.readFileSync(file)
        return md5(data)
    }

}

const PACKAGE_NAME = 'cc-compress-img'

export function Log(...args: any[]) {
    console.log(`[${PACKAGE_NAME}]`, ...args)
    // if (Editor && Editor["log"]) {
    //     Editor["log"](`[${PACKAGE_NAME}]`, ...args)
    // } else {
    //     console.log(`[${PACKAGE_NAME}]`, ...args)
    // }
}

