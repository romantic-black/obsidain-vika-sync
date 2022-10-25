import { App, Editor, MarkdownView, Modal, Notice, MetadataCache, TFile, parseFrontMatterStringArray, getAllTags, FrontMatterCache, CachedMetadata, parseFrontMatterAliases } from 'obsidian';
import { resolve, extname, relative, join, parse, posix } from "path";
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { execSync, exec } from "child_process";
import { MyVika } from "utils/vika";

export {MyNote, MyObsidian};

// 这些值都可以从 Obsidian 的 API 中获取
interface BasicFields {
    title: string;
    folder: string;
    tags: Array<string> | null;
    aliases: Array<string> | null;
    content: string;
    outlink: Array<string>;
    backlink: Array<string>;
    obsidianURL: string;
}

interface BasicFMAtrributes {
    uid: string | undefined;
    vikaLink: string | undefined;
    tags: Array<string> | null;
    aliases: Array<string> | null;
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

    async deleteRecordInThisPage() {
    }

    async createRecordInThisFolder() {
    }

    async updateRecordInThisFolder() {
    }

    async updateALL() {
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
    tags: Array<string> | null;
    aliases: Array<string> | null;
    content: string;
    outlink: Array<string>;
    backlink: Array<string>;
    obsidianURL: string;
    uid: string | undefined;
    vikaLink: string | undefined;

    constructor(app: App, file: TFile, vika: MyVika) {
        this.app = app;
        this.file = file;
        this.vika = vika;
    }
    async updateInfo(){
        let file:TFile = this.file;
        this.frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
        this.cache = app.metadataCache.getFileCache(file);
        this.aliases = parseFrontMatterAliases(this.frontmatter);
        this.tags = this.cache? getAllTags(this.cache):null;
        this.title = file.basename;
        this.folder = file.parent.name;
        const vaultName = encodeURI(file.vault.getName());
        let basicURL:string = `obsidian://open?vault=${vaultName}&file=${file.path}`; 
        let advancedURL:string = `obsidian://advanced-uri?vault=${vaultName}&uid=`;
        this.uid = this.frontmatter?.["uid"];
        this.obsidianURL = this.uid? advancedURL + this.uid: basicURL;
        this.vikaLink = this.frontmatter?.["vikaLink"];
        this.content = await this.app.vault.read(this.file);
        return {
                "标题": this.title,
                "文件夹": this.folder,
                "标签": this.tags,
                "别名": this.aliases,
                "内容": this.content,
                //"出链": this.outlink,
                //"入链": this.backlink,
                "URL": this.obsidianURL,
            }
    }

    async createRecord() {
        const msg = await this.updateInfo();
        const record = await this.vika.createRecord(msg)
        this.uid = record.data?.records[0]?.recordId;
        this.vikaLink = this.uid?this.vika.getURL(this.uid):undefined;
        return record;
    }

    async updateRecord() {
        const msg = await this.updateInfo();

        if(this.uid){
            const record = await this.vika.updateRecord(this.uid, msg)
            return record;
        }
        else{
            const record = await this.createRecord();
            return record;
        }   
    }
}