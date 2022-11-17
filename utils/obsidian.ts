import { App, Editor, MarkdownView, Modal, Notice, MetadataCache, TFile,
    parseFrontMatterStringArray, getAllTags, FrontMatterCache, CachedMetadata, 
    parseFrontMatterAliases, parseFrontMatterEntry, moment } from 'obsidian';
import { MyVika, VikaPluginSettings } from "utils/vika";
import { ICreateRecordsResponseData, IHttpResponse } from '@vikadata/vika';
import { generate_suggester } from "utils/suggester";


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
    BackLinks: (undefined|string)[];
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
    settings: any;
    constructor(app: App, vika: MyVika, settings: VikaPluginSettings) {
        this.app = app;
        this.vault = app.vault;
        this.vika = vika;
        this.settings = settings;
    }

    async createRecordInThisPage() {
        let file: TFile|null = this.app.workspace.getActiveFile();
        if (!file) {
            return;
        }
        let note: MyNote = new MyNote(this.app, file, this.vika, this.settings);
        const datasheetId = await this.vika.selectDatasheet()
        if(!datasheetId) {
            return;
        }
        let res = await note.createRecord(datasheetId);
        if(res.success) {
            new Notice(`Create ${file.name} success`);
        }
        else {
            new Notice(`${file.name}: ${res.message}`);
        }
        return res;
    }

    async updateRecordInThisPage() {
        let file: TFile|null = this.app.workspace.getActiveFile();
        if (!file) {
            return;
        }
        let note: MyNote = new MyNote(this.app, file, this.vika, this.settings);
        let res = await note.updateRecord();
        if(!res){
            res = await this.createRecordInThisPage();
        }
        else if(res.success) {
            new Notice(`Update ${file.name} success`);
        }
        else {
            new Notice(`${file.name}: ${res.message}`);
        }
        return res;
    }

    async deleteRecordAndThisPage() {
        let file: TFile|null = this.app.workspace.getActiveFile();
        if (!file) {
            return null;
        }
        let note: MyNote = new MyNote(this.app, file, this.vika, this.settings);
        let res = await note.deleteRecord();
        if(!res){
            new Notice(`${file.name} vikaLink not found`);
        }
        else if(!res.success){
            new Notice(`${file.name}: ${res.message}, delete failed`);
        }
        else {
            new Notice(`${file.name} delete success`);
        }
        return res;
    }

    async recoverFromRecord() {
        let file: TFile|null = this.app.workspace.getActiveFile();
        if (!file) {
            return null;
        }
        let note: MyNote = new MyNote(this.app, file, this.vika, this.settings);
        let res = await note.getRecord();
        if(!res) {
            new Notice(`${file.name} vikaLink not found`);
        }
        else if (res.success) {
            new Notice(`Download ${file.name} success`);
        }
        else {
            new Notice(`${file.name}: ${res.message}, Download failed`);
        }
        return res;
    }

    async updateRecordInThisFolder() {
        let file: TFile|null = this.app.workspace.getActiveFile();
        if (!file) {
            return null;
        }
        const files = file.parent.children;
        const datasheetId = await this.vika.selectDatasheet()
        if(!datasheetId) {
            return;
        }
        for (let file of files) {
            if(file instanceof TFile && file.extension === "md") {
                let note: MyNote = new MyNote(this.app, file, this.vika, this.settings);
                let res = await note.updateRecord();
                if(!res || !res.success) {
                    if (res?.code == 429){
                        files.push(file);
                        continue;
                    }
                    res = await note.createRecord(datasheetId);
                    if(!res.success){
                        new Notice(`${file.name}: ${res.message}, create failed`);
                    }
                    else if(res.code == 429){
                        files.push(file);
                    }
                    else {
                        new Notice(`${file.name} create success`);
                    }
                }
                else {
                    new Notice(`Update ${file.name} success`);
                } 
            }
        }
        new Notice(`Update Note in Folder: ${file.parent.path} finished`);
    }


    async updateAllRecord() {
        let files = this.vault.getMarkdownFiles();
        const datasheetId = await this.vika.selectDatasheet()
        if(!datasheetId) {
            return;
        }
        for (let file of files) {
            let note: MyNote = new MyNote(this.app, file, this.vika, this.settings);
            let res = await note.updateRecord();
            if(!res || !res.success){
                if (res?.code == 429){
                    files.push(file);
                    continue;
                }
                res = await note.createRecord(datasheetId);
                if(!res.success){
                    new Notice(`${file.name}: ${res.message}, create failed`);
                }
                else if(res.code == 429){
                    files.push(file);
                }
                else {
                    new Notice(`${file.name} create success`);
                }
            }
            else {
                new Notice(`Update ${file.name} success`);
            }
        }
        new Notice(`Update Note in Vault: ${this.app.vault.getName()} finished`);
    }

    async getRecordInThisFolder(){
        let file: TFile|null = this.app.workspace.getActiveFile();
        if (!file) {
            return null;
        }
        const folder = file.parent.path;
        const datasheetId = await this.vika.selectDatasheet()
        if(!datasheetId) {
            return;
        }
        let note: MyNote = new MyNote(this.app, file, this.vika, this.settings);
        let res = await note.getRecordInFolder(folder, datasheetId);
        if(res.success){
            new Notice(`${folder}: ${res.message} success`);
        }
        else {
            new Notice(`${folder}: ${res.message} download failed`)
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
    backlink: (undefined|string)[];
    unresolvedOutLinks: Array<string>;
    obsidianURI: string;
    uid: string | undefined;
    dstId: string | undefined;
    viwId: string | undefined;
    vikaLink: string | undefined;
    vault: string;
    id: string;
    createTime: string;
    updateTime: string;
    settings: VikaPluginSettings;
    constructor(app: App, file: TFile, vika: MyVika, settings: any) {
        this.app = app;
        this.file = file;
        this.vika = vika;
        this.settings = settings;
    }

    parseVikaLink(vikaLink:string | undefined) {
        if(!vikaLink) {
            return [undefined, undefined, undefined];
        }
        let infoList = vikaLink.split("/");
        let recordId = infoList.pop();
        let viewId = infoList.pop();
        let dstId = infoList.pop();
        if(recordId?.startsWith("rec") && viewId?.startsWith("viw") && dstId?.startsWith("dst")){
            return [dstId, viewId, recordId];
        }
        return [undefined, undefined, undefined];
    }

    async updateInfo(){
        
        let file:TFile = this.file;
        this.frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
        this.cache = app.metadataCache.getFileCache(file);
        this.aliases = parseFrontMatterAliases(this.frontmatter) || [];
        this.tags = this.cache? (getAllTags(this.cache) || []):[];
        this.tags = this.tags.map((tag) => tag.replace("#", ""));
        this.tags = Array.from(new Set(this.tags));
        this.title = file.basename;
        this.folder = file.parent.path;
        this.vault = file.vault.getName();
        let basicURL:string = `obsidian://open?vault=${this.vault}&file=${file.path}`; 
        this.vikaLink = this.frontmatter?.["vikaLink"];
        [this.dstId, this.viwId, this.uid] = this.parseVikaLink(this.vikaLink);
        this.obsidianURI = encodeURI(basicURL);
        let ctime = moment(new Date(file.stat.ctime));
        let mtime = moment(new Date(file.stat.mtime));
        this.createTime = ctime.format("YYYY-MM-DD HH:mm");
        this.updateTime = mtime.format("YYYY-MM-DD HH:mm");
        this.id = ctime.format("YYYYMMDDHHMMSS");
        this.getLinks();

        let update = this.settings.datasheetList.find((item) => item.id == this.dstId)?.updateField || {};
        update = this.getCustomFieldsFromFrontMatter(update, this.frontmatter);

        this.content = await this.app.vault.read(this.file);
        this.content = this.removeFrontMatterFromContent(this.content);
        let data: BasicFields = {
                Title: this.title,
                Folder: this.folder,
                Tags: this.tags,
                Aliases: this.aliases,
                Content: this.content,
                OutLinks: this.outlink,
                BackLinks: this.backlink,
                UnresolvedOutLinks: this.unresolvedOutLinks,
                OBURI: this.obsidianURI,
                Vault: this.vault,
                CreatedTime: this.createTime,
                UpdatedTime: this.updateTime,
                ID: this.id,
                ...update
            };
        return data;
    }

    getCustomFieldsFromFrontMatter(customField: {[key:string]:string|Array<string>}, frontmatter: FrontMatterCache|undefined) {
        let data: {[key:string]:string|Array<string>} = {};
        for(let [key, value] of Object.entries(customField)){
            if (value instanceof Array){
                value = value.filter(i => i != "");
                data[key] = parseFrontMatterStringArray(frontmatter, key) || value;
            }
            else if(value != ""){
                data[key] = parseFrontMatterEntry(frontmatter, key) || value;
            }
            else if(value == "" && parseFrontMatterEntry(frontmatter, key)){
                data[key] =  parseFrontMatterEntry(frontmatter, key);
            }
        }
        return data;
    }

    getFrontMatterFromFields(customField: {[key:string]:string}, fields:any, recordId: string){
        let data:any = {};
        for(const key of Object.keys(customField)){
            let value = fields[key];
            data[key] = value || "";
        }
        data["vikaLink"] = this.dstId? this.vika.getURL(recordId, this.dstId) || "" : "";
        data["tags"] = fields["Tags"] || [""];
        data["aliases"] = fields["Aliases"] || [""];
        this.AddQuotationInFrontMatter(data);

        return data;
    }

    AddQuotationInFrontMatter(frontmatter:any){
        for(let [key, value] of Object.entries(frontmatter)){
            if(value instanceof Array){
                frontmatter[key] = value.map((item) => item != ""?`"${item}"`:item);
            }
            else {
                frontmatter[key] = value != ""? `"${value}"`:value;
            }
        }
    }

    async createRecord(datasheetId: string) {
        const msg = await this.updateInfo();
        
        const record = await this.vika.createRecord(msg, datasheetId)
        this.dstId = datasheetId;
        if(!record.success){
            console.log(msg);
            return record
        }
        this.recoverFrontMatterFromRecord(record);
        return record;
    }

    async updateRecord() {
        const msg = await this.updateInfo();
       
        if(this.uid && this.dstId){
            const record = await this.vika.updateRecord(this.uid, msg, this.dstId);
            if(!record.success){
                console.log(msg, this.uid);
                return record
            }
            this.recoverFrontMatterFromRecord(record);
            return record;
        }
    }

    async deleteRecord() {
        const msg = await this.updateInfo();
        if(this.uid && this.dstId){
            const record = await this.vika.deleteRecord(this.uid, this.dstId);
            if(!record.success){
                console.log(this.uid);
            }
            else{
                this.app.vault.trash(this.file, false);
            }
            return record;
        }
    }

    async getRecord(){
        const msg = await this.updateInfo();
        if(!this.uid || !this.dstId){
            return;
        }
        const record = await this.vika.getRecord(this.uid, this.dstId);
        await this.recoverFullContentFromRecord(record);
        return record;
    }

    async getRecordInFolder(folder: string, datasheetId: string){
        const msg = await this.updateInfo();
        const record = await this.vika.getRecordInFolder(folder, datasheetId);
        if(!record.success){
            console.log(msg);
            return record
        }
        await this.recoverFullContentFromRecord(record);
        return record;
    }

    async recoverFullContentFromRecord(record: IHttpResponse<ICreateRecordsResponseData> | undefined){
        if(!record || !record.success)
            return;
        for (const i of record.data.records){
            const fields = i.fields;
            const recordId = i.recordId;
            const recoverField = this.settings.datasheetList.find((item) => item.id == this.dstId)?.recoverField || {};
            let fm_dict = this.getFrontMatterFromFields(recoverField, fields, recordId);
            let fm_text = this.dumpsFrontMatter(fm_dict);
            let full_content = fm_text + fields["Content"];
            let filePath = this.folder + "/" + fields["Title"] + ".md";
            
            await this.app.vault.adapter.write(filePath, full_content);
        }
        this.updateInfo();
    }

    parseFrontMatterDict(fm: FrontMatterCache|undefined){
        let fm_dict:{[key:string]:any} = {}
        if (!fm)
            return fm_dict;
        for(let [key, value] of Object.entries(fm).filter(([key, value]) =>
         !["position", "Tags", "tags", "Tag", "tag", "Aliases", "aliases", "Alias", "alias", "vikaLink"].includes(key)))
        {
            if (value instanceof Array) {
                let arrayData = parseFrontMatterStringArray(fm, key) || "";
                fm_dict[key] = arrayData;
            } else {
                fm_dict[key] = parseFrontMatterEntry(fm, key) || value || "";
            }
        }
        return fm_dict;
    }

    recoverFrontMatterFromRecord(record: IHttpResponse<ICreateRecordsResponseData> | undefined){
        if(!record || !record.success)
            return null;
        let fm_dict = this.parseFrontMatterDict(this.frontmatter);
        
        let fields = record.data.records[0].fields;
        let recordId = record.data.records[0].recordId;
        const recoverField = this.settings.datasheetList.find((item) => item.id == this.dstId)?.updateField || {};
        fm_dict = Object.assign(fm_dict, this.getFrontMatterFromFields(recoverField, fields, recordId));
        let fm_text = this.dumpsFrontMatter(fm_dict);
        let full_content = fm_text + this.content;
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
			return "\n" + value.map(item => " - " + item).join("\n");
		} else {
			return value;
		}
	}
    
    getBackLinks(metadataCache:MetadataCache, path:string) {
		let links =  Object.entries(metadataCache.resolvedLinks).filter(([k, v]) => Object.keys(v).length).filter(item => item[1].hasOwnProperty(path)).map(item => { return item[0].split("/").pop()?.replace(".md", "")});
        return  links.filter(item => item)
    }

    getUnresolvedOutLinks(metadataCache:MetadataCache, path:string) {
		return Object.entries(metadataCache.unresolvedLinks).filter(([k, v]) => Object.keys(v).length).filter(item => item[0] == path).map(item => Object.keys(item[1])).flat();
	}

    getLinks() {
        let backlinks = this.getBackLinks(this.app.metadataCache, this.file.path) || [];
		let links = app.metadataCache.getFileCache(this.file)?.links;
        if(!links){
            [this.backlink, this.outlink, this.unresolvedOutLinks]= [backlinks, [], []];
            return;
        }

        let outlinks = links.map(n => n.link.split("|")[0].split("#")[0].trim());
        outlinks = Array.from(new Set(outlinks));
        let unresolvedOutlinks = this.getUnresolvedOutLinks(this.app.metadataCache, this.file.path);
        outlinks = outlinks.filter(item => unresolvedOutlinks.indexOf(item) === -1 && item != "");

        [this.backlink, this.outlink, this.unresolvedOutLinks]= [backlinks, outlinks, unresolvedOutlinks]
    }
}
