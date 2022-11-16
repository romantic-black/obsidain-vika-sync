import { Vika, INodeItem } from "@vikadata/vika";
import {SuggesterModal} from "utils/suggester";
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { resolve, extname, relative, join, parse, posix } from "path";
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { execSync, exec } from "child_process";
import { Datasheet} from "@vikadata/vika/es/datasheet";
import { throws } from "assert";

interface MyDatasheet{
	id: string;
	name: string;
	updateField: any;
	recoverField: any;
}

interface VikaPluginSettings {
	token: string;
	datasheetList: Array<MyDatasheet>;
}


class MyVika {
    vika: Vika;
    datasheetList: Array<INodeItem>;
    viewDict: any;
    constructor(token: string) {
        this.vika = new Vika({ token: token });
    }


    async getAllDatasheetInfo() {
        const spaceListResp = await this.vika.spaces.list()
        this.viewDict = {};
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
                    let view = await (await this.vika.datasheet(node.id).views.list())
                    this.viewDict[node.id] = view.data?.views.find(view => view.type === "Grid")?.id;
                }
            }
        }
    }

    async selectDatasheet(){
        let text_items = this.datasheetList.map(item => item.name);
        let items = this.datasheetList.map(item => item.id);
        let selector = new SuggesterModal(text_items, items, "Choose your datasheet", 20);
        let id:string|undefined = undefined;
        await selector.openAndGetValue(item => id = item);
        return id;
    }

    async createRecord(fields: any, datasheetId: string) {
        const res = await this.vika.datasheet(datasheetId).records.create([{fields: fields}]);
        return res;
    }

    async updateRecord(uid:string, fields: any, datasheetId: string) {
        const res = await this.vika.datasheet(datasheetId).records.update([{"recordId": uid, "fields": fields}]);
        return res;
    }

    async deleteRecord(uid:string, datasheetId: string) {
        const res = await this.vika.datasheet(datasheetId).records.delete(uid);
        return res;
    }

    async getRecord(uid: string, datasheetId: string) {
        const res = await this.vika.datasheet(datasheetId).records.get(uid);
        return res;
    }

    async getRecordInFolder(folder: string, datasheetId: string) {
        const res = await this.vika.datasheet(datasheetId).records.query({
            filterByFormula: `find("${folder}", {Folder}) > 0`,
        });
        return res;     
    }

    getURL(recordId: string, datasheetId: string) {
        const viewId = this.viewDict[datasheetId];
        if (!viewId || !viewId.startsWith("viw")) {
            return undefined;
        }
        return `https://vika.cn/workbench/${datasheetId}/${viewId}/${recordId}`;
    }
}


export { MyVika };
export type { VikaPluginSettings };