import { Vika, INodeItem } from "@vikadata/vika";
import { generate_suggester } from "utils/suggester";
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';


interface MyDatasheet{
	id: string;
	name: string;
	viewId: string;
    updateField: any;
	recoverField: any;
}

interface VikaPluginSettings {
	token: string;
	datasheetList: Array<MyDatasheet>;
}


class MyVika {
    vika: Vika;
    datasheetList: Array<MyDatasheet>;
    constructor(settings: VikaPluginSettings) {
        this.vika = new Vika({ token: settings.token });
        this.datasheetList = settings.datasheetList;
    }

    async getAllDatasheetInfo() {
        const spaceListResp = await this.vika.spaces.list();
        if (!spaceListResp.success) {
            return;
        }
        let tmpList = [];
        const spaces = spaceListResp.data.spaces.filter(space => space.isAdmin);
        for(let space of spaces) {
            const nodeListResp = await this.vika.nodes.list({spaceId: space.id})
            if (!nodeListResp.success) {
                continue;
            }
            
            let nodes = nodeListResp.data.nodes;
            for(let node of nodes) {
                if(node.type === "Folder"){
                    const folderDetailResp = await this.vika.nodes.get({spaceId: space.id, nodeId: node.id})
                    if (folderDetailResp.success && folderDetailResp.data.children) {
                        nodes.push(...folderDetailResp.data.children);
                    }
                    else if(folderDetailResp.code == 429){
                        nodes.push(node);
                    }
                }
                else if(node.type === "Datasheet"){
                    let view = (await this.vika.datasheet(node.id).views.list()).data?.views.find(view => view.type === "Grid")?.id;
                    if(view){
                        tmpList.push({id: node.id, name: node.name, updateField: {}, recoverField: {}, viewId: view});
                    }
                }
            }
        }

        for(let item of tmpList){
            let tmp = this.datasheetList.find(i => i.id === item.id);
            if(tmp){
                item.updateField = tmp.updateField;
                item.recoverField = tmp.recoverField;
            }
        }

        this.datasheetList = tmpList;
    }

    async selectDatasheet(){
        let text_items = this.datasheetList.map(item => item.name);
        let items = this.datasheetList.map(item => item.id);
        let selector = generate_suggester();
        let res = await selector(text_items, items, false, "Choose a datasheet", 20);
        return res;
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
        const viewId = this.datasheetList.find(item => item.id === datasheetId)?.viewId;
        return `https://vika.cn/workbench/${datasheetId}/${viewId}/${recordId}`;
    }
}


export { MyVika };
export type { VikaPluginSettings };