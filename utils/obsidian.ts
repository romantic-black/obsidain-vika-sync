import { App, Editor, MarkdownView, Modal, Notice, MetadataCache, TFile, 
    parseFrontMatterStringArray, getAllTags, FrontMatterCache, CachedMetadata, 
    parseFrontMatterAliases, parseFrontMatterEntry, moment } from 'obsidian';
import { resolve, extname, relative, join, parse, posix } from "path";
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { execSync, exec } from "child_process";
import { MyVika } from "utils/vika";
import { ICreateRecordsResponseData, IHttpErrorResponse, IHttpResponse } from '@vikadata/vika';
import { stringify } from 'querystring';


export {MyNote, MyObsidian};

// 这些值都可以从 Obsidian 的 API 中获取
interface BasicFields {
    Title: string;
    Folder: string;
    Tags: Array<string>;
    Vault: string;
    Aliases: Array<string>;
    Content: string;
    OutLinks: Array<string>;
    BackLinks: Array<string>;
    UnresolvedOutLinks: Array<string>;
    OBURI: string;
    ID: string;
    UpdatedTime: string;
    CreatedTime: string;
}

interface BasicFrontMatterAtrributes {
    uid: string | undefined;
    vikaLink: string | undefined;
    tags: Array<string>|null;
    aliases: Array<string>|null;
}

class MyObsidian {
    app: App;
    vault: any;
    vika: MyVika;
    constructor(app: App, vika: MyVika) {
        this.app = app;
        this.vault = app.vault;
        this.vika = vika;
    }

    async createRecordInThisPage() {
        let file: TFile|null = this.app.workspace.getActiveFile();
        if (!file) {
            return null;
        }
        let note: MyNote = new MyNote(this.app, file, this.vika);
        let res = await note.createRecord();
        return res;
    }

    async updateRecordInThisPage() {
        let file: TFile|null = this.app.workspace.getActiveFile();
        if (!file) {
            return null;
        }
        let note: MyNote = new MyNote(this.app, file, this.vika);
        let res = await note.updateRecord();
        return res;
    }

    async deleteRecordAndThisPage() {
        let file: TFile|null = this.app.workspace.getActiveFile();
        if (!file) {
            return null;
        }
        let note: MyNote = new MyNote(this.app, file, this.vika);
        let res = await note.deleteRecord();
        return res;
    }

    async recoverFromRecord() {
        let file: TFile|null = this.app.workspace.getActiveFile();
        if (!file) {
            return null;
        }
        let note: MyNote = new MyNote(this.app, file, this.vika);
        let res = await note.getRecord();
        return res;
    }

    async updateRecordInThisFolder() {
        let file: TFile|null = this.app.workspace.getActiveFile();
        if (!file) {
            return null;
        }
        const files = file.parent.children;
        for (let file of files) {
            if(file instanceof TFile && file.extension == "md") {
                let note: MyNote = new MyNote(this.app, file, this.vika);
                let res = await note.updateRecord();
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }

    async updateAllRecord() {
        let files = this.vault.getMarkdownFiles();
        for (let file of files) {
            let note: MyNote = new MyNote(this.app, file, this.vika);
            let res = await note.updateRecord();
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}

class MyNote {
    app: App;
    file: any;
    vika: MyVika;
    cache: CachedMetadata|null;
    frontmatter: FrontMatterCache|undefined;
    title: string;
    folder: string;
    tags: Array<string>|null;
    aliases: Array<string>|null;
    content: string;
    outlink: Array<string>;
    backlink: Array<string>;
    obsidianURI: string;
    uid: string | undefined;
    vikaLink: string | undefined;
    vault: string;
    id: string;
    createTime: string;
    updateTime: string;
    constructor(app: App, file: TFile, vika: MyVika) {
        this.app = app;
        this.file = file;
        this.vika = vika;
    }

    async updateInfo(){
        let file:TFile = this.file;
        this.frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
        this.cache = app.metadataCache.getFileCache(file);
        this.aliases = parseFrontMatterAliases(this.frontmatter) || [];
        this.tags = this.cache? (getAllTags(this.cache) || []):[];
        this.title = file.basename;
        this.folder = file.parent.name;
        const vaultName = encodeURI(file.vault.getName());
        let basicURL:string = `obsidian://open?vault=${vaultName}&file=${file.path}`; 
        let advancedURL:string = `obsidian://advanced-uri?vault=${vaultName}&uid=`;
        this.uid = this.frontmatter?.["uid"];
        this.obsidianURI = this.uid? advancedURL + this.uid: basicURL;
        this.vikaLink = this.frontmatter?.["vikaLink"];
        this.vault = file.vault.getName();
        let ctime = moment(new Date(file.stat.ctime));
        let mtime = moment(new Date(file.stat.mtime));
        this.createTime = ctime.format("YYYY-MM-DD HH:mm");
        this.updateTime = mtime.format("YYYY-MM-DD HH:mm");
        this.id = ctime.format("YYYYMMDDHHMMSS");
        
        this.content = await this.app.vault.read(this.file);
        this.content = this.removeFrontMatterFromContent(this.content);
        let data: BasicFields = {
                Title: this.title,
                Folder: this.folder,
                Tags: this.tags,
                Aliases: this.aliases,
                Content: this.content,
                OutLinks: [],
                BackLinks: [],
                UnresolvedOutLinks: [],
                OBURI: this.obsidianURI,
                Vault: this.vault,
                CreatedTime: this.createTime,
                UpdatedTime: this.updateTime,
                ID: this.id,
            };
        return data;
    }

    async createRecord() {
        const msg = await this.updateInfo();
        const record = await this.vika.createRecord(msg)
        if(!record.success)
            console.log(msg);
        this.updateFrontMatterFromRecord(record);
        return record;
    }

    async updateRecord() {
        const msg = await this.updateInfo();
       
        if(this.uid){
            const record = await this.vika.updateRecord(this.uid, msg)
            if(!record.success)
                console.log(msg, this.uid);
            this.updateFrontMatterFromRecord(record);
            return record;
        }
        else{
            return await this.createRecord();
        }
    }

    async deleteRecord() {
        const msg = await this.updateInfo();
        if(this.uid){
            const record = await this.vika.deleteRecord(this.uid)
            if(!record.success){
                console.log(this.uid);
                return null;    
            }
            this.app.vault.trash(this.file, false);
            return true;
        }
        else{
            this.app.vault.trash(this.file, false);
            return false;
        }
    }

    async getRecord(){
        const msg = await this.updateInfo();
        if(!this.uid){
            return null;
        }

        const record = await this.vika.getRecord(this.uid);
        if(!record.success){
            console.log(this.uid);
            return null;
        }
        const fields = record.data.records[0].fields;   
        this.updateFullContentFromRecordFields(fields);
        return record;
    }

    updateFullContentFromRecordFields(fields: any){
        let fm_dict:{[key:string]:any} = {}
        for (const [key, value] of Object.entries(fields).filter(([key, value]) => 
        !["Title", "Folder", "Content", "OutLinks", "BackLinks","Tags","Aliases", "OBURI"].includes(key))) {
            fm_dict[key] = value;
        }
        fm_dict["uid"] = this.uid;
        fm_dict["vikaLink"] = this.vika.getURL(fm_dict["uid"]);
        fm_dict["Tags"] = fields.tags || [""];
        fm_dict["Aliases"] = fields.aliases || [""];

        let fm_text = this.dumpsFrontMatter(fm_dict);
        let full_content = fm_text + '\n' + fields["Content"];
        this.app.vault.modify(this.file, full_content);

        this.updateInfo();
        return null;
    }

    parseFrontMatterDict(fm: FrontMatterCache|undefined){
        let fm_dict:{[key:string]:any} = {}
        if (!fm)
            return fm_dict;
        for(let [key, value] of Object.entries(fm).filter(([key, value]) => key !== "position"))
        {
            if (value instanceof Array) {
                let arrayData = parseFrontMatterStringArray(fm, key) || value;
                fm_dict[key] = arrayData;
            } else {
                fm_dict[key] = parseFrontMatterEntry(fm, key) || value;
            }
        }
        return fm_dict;
    }

    updateFrontMatterFromRecord(record: IHttpResponse<ICreateRecordsResponseData> | undefined){
        if(!record?.success)
            return null;
        let fm_dict = this.parseFrontMatterDict(this.frontmatter);
        fm_dict["uid"] = record.data?.records[0]?.recordId;
        fm_dict["vikaLink"] = this.vika.getURL(fm_dict["uid"]);
        fm_dict["Tags"] = record.data?.records[0]?.fields["Tags"] || [""];
        fm_dict["Aliases"] = record.data?.records[0]?.fields["Aliases"] || [""];
        
        let fm_text = this.dumpsFrontMatter(fm_dict);
        let full_content = fm_text + '\n' + this.content;
        this.app.vault.modify(this.file, full_content);

        this.updateInfo();
        return null;
    }

    // 必须在FrontMatter获取后调用
    removeFrontMatterFromContent(content: string){
        let docArray = content.split("\n");
		let startLine = this.frontmatter ? this.frontmatter.position.end.line + 1 : 0;
        return docArray.slice(startLine).join("\n");
    }

    dumpsFrontMatter(fm_dict: {[key:string]:any}){
        let fm_text = Object.entries(fm_dict).map(([key, value]) => key + ": " + this.makeFmValue(value)).join("\n")
        fm_text = fm_text?"---\n" + fm_text + "\n---\n":"";
        return fm_text;
    }

	makeFmValue(value:any) {
		if (value instanceof Array) {
			return "\n" + value.map(item => " - " + item).join("\r");
		} else {
			return value;
		}
	}
}
