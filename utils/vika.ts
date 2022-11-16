import { Vika, INodeItem } from "@vikadata/vika";
import {SuggesterModal} from "utils/suggester";
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { resolve, extname, relative, join, parse, posix } from "path";
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { execSync, exec } from "child_process";
import { Datasheet} from "@vikadata/vika/es/datasheet";
import { throws } from "assert";


class MyVika {
    vika: Vika;
    currentDatasheet: Datasheet;
    datasheetList: Array<INodeItem>;
    viewList: Array<any>;
    constructor(token: string) {
        this.vika = new Vika({ token: token });
    }

    async getDatasheet(datasheetId:string) {
        this.currentDatasheet = this.vika.datasheet(datasheetId);
        const res = await (await this.currentDatasheet.views.list())
        if(res.success){
            this.viewList = res.data.views;
        }
    }

    async getAllDatasheetInfo() {
        const spaceListResp = await this.vika.spaces.list()
        if (!spaceListResp.success) {
            return;
        }
        let spaces = spaceListResp.data.spaces.filter(space => space.isAdmin);
        for(let space of spaces) {
            const nodeListResp = await this.vika.nodes.list({spaceId: space.id})
            if (!nodeListResp.success) {
                continue;
            }
            let nodes = nodeListResp.data.nodes;
            for(let node of nodes) {
                if(node.type === "folder"){
                    const folderDetailResp = await this.vika.nodes.get({spaceId: space.id, nodeId: node.id})
                    if (folderDetailResp.success && folderDetailResp.data.children) {
                        nodes.push(...folderDetailResp.data.children);
                    }
                }
                else if(node.type === "datasheet"){
                    this.datasheetList.push(node);
                }
            }
        }
    }

    async selectDatasheet(){
        let text_items = this.datasheetList.map(item => item.name);
        let items = this.datasheetList.map(item => item.id);
        let selector = new SuggesterModal(text_items, items, "Choose your datasheet", 20);
        let id:string = "";
        await selector.openAndGetValue(item => id = item);
        await this.getDatasheet(id);
    }

    async createRecord(fields: any) {
        const res = await this.currentDatasheet.records.create([{fields: fields}]);
        return res;
    }

    async updateRecord(uid:string, fields: any) {
        const res = await this.currentDatasheet.records.update([{"recordId": uid, "fields": fields}]);
        return res;
    }

    async deleteRecord(uid:string) {
        const res = await this.currentDatasheet.records.delete(uid);
        return res;
    }

    async getRecord(uid: string) {
        const res = await this.currentDatasheet.records.get(uid);
        return res;
    }

    async getRecordInFolder(folder: string) {
        const res = await this.currentDatasheet.records.query({
            filterByFormula: `find("${folder}", {Folder}) > 0`,
        });
        return res;     
    }

    getURL(recordId: string) {
        const datasheetId = this.currentDatasheet.datasheetId;
        const viewId = this.viewList.filter(view => view.type === "Grid")[0];
        return `https://vika.cn/workbench/${datasheetId}/${viewId}/${recordId}`;
    }
}


export { MyVika };