import { Vika } from "@vikadata/vika";
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { resolve, extname, relative, join, parse, posix } from "path";
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { execSync, exec } from "child_process";
import { Datasheet } from "@vikadata/vika/es/datasheet";


class MyVika {
    vika: Vika;
    datasheet: Datasheet;
    datasheetId: string;
    viewId: string;
    constructor(token: string, datasheetId: string, veiwId: string) {
        this.vika = new Vika({ token: token });
        this.datasheet = this.vika.datasheet(datasheetId);
        this.datasheetId = datasheetId;
        this.viewId = veiwId;
    }

    async createRecord(fields: any) {
        const res = await this.datasheet.records.create([{fields: fields}]);
        return res;
    }

    async updateRecord(uid:string, fields: any) {
        const res = await this.datasheet.records.update([{"recordId": uid, "fields": fields}]);
        return res;
    }
    
    async deleteRecord(uid:string) {
        const res = await this.datasheet.records.delete(uid);
        return res;
    }

    async getRecord(uid: string) {
        const res = await this.datasheet.records.get(uid);
        return res;
    }

    async getRecordInFolder(folder: string) {
        const res = await this.datasheet.records.query({
            filterByFormula: `find("${folder}", {Folder}) > 0`,
        });
        return res;     
    }

    getURL(recordId: string) {
        return `https://vika.cn/workbench/${this.datasheet.datasheetId}/${this.viewId}/${recordId}`;
    }
}


export { MyVika };