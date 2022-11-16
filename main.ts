import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { MyVika } from "utils/vika";
import { MyNote, MyObsidian } from "utils/obsidian";

// Remember to rename these classes and interfaces!

const DEFAULT_CUSTOM_FIELD:Datasheet = {
	id: "",
	name: "",
	updateField: {
		"type": "笔记",
		"description":[]
	},
	recoverField: {
		"type": "",
		"description":""
	}
}

interface Datasheet{
	id: string;
	name: string;
	updateField: any;
	recoverField: any;
}

interface VikaPluginSettings {
	token: string;
	datasheetList: Array<Datasheet>;
}

export default class VikaSyncPlugin extends Plugin {
	settings: VikaPluginSettings;
	vika: MyVika;
	ob: MyObsidian;
	async onload() {
		try{
			await this.loadSettings();
		}
		catch (e) {
			console.log(e);
		}
		this.addCommand({
			id: 'vika-sync-create-record',
			name: 'Create New Record for this Note',
			callback: () => {
				this.ob.createRecordInThisPage()
			}});
		this.addCommand({
			id: 'vika-sync-update-note',
			name: 'Update this Note',
			callback: () => {
				this.ob.updateRecordInThisPage()
			}});
		this.addCommand({
			id: 'vika-sync-update-note-in-folder',
			name: 'Update Note in this Folder',
			callback: () => {
				this.ob.updateRecordInThisFolder()
			}});
		this.addCommand({
			id: 'vika-sync-update-note-in-vault',
			name: 'Update Note in this Vault',
			callback: () => {
				this.ob.updateAllRecord();
		}});
		this.addCommand({
			id: 'vika-sync-delete-note-record',
			name: 'Delete this Note & Record',
			callback: () => {
				this.ob.deleteRecordAndThisPage()
		}
		});
		this.addCommand({
			id: 'vika-sync-recover-note',
			name: 'Download this Note from Record',
			callback: () => {
				this.ob.recoverFromRecord()
			}});
		this.addCommand({
			id: 'vika-sync-recover-note-in-folder',
			name: 'Download Note in this Folder',
			callback: () => {
				this.ob.getRecordInThisFolder()
			}});
		this.addSettingTab(new SettingTab(this.app, this));
	}


	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, await this.loadData());
		this.vika = new MyVika(this.settings.token);
		this.ob = new MyObsidian(this.app, this.vika, this.settings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		try{
			await this.loadSettings();
		}
		catch (e) {
			console.log(e);
		}
	}
}

class SettingTab extends PluginSettingTab {
	plugin: VikaSyncPlugin;

	constructor(app: App, plugin: VikaSyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Vika Sync Settings'});

		containerEl.createEl('h3', {text: 'Vika Token'});

		new Setting(containerEl)
			.setName('Token')
			.setDesc("从Vika的API设置中获取")
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.token)
				.onChange(async (value) => {
					this.plugin.settings.token = value;
					await this.plugin.saveSettings();
				}));
		
		new Setting(containerEl)
			.addButton(cb => {this.plugin.vika.getAllDatasheetInfo().then(
				() => {
					let nameList = this.plugin.vika.datasheetList.map((item) => item.name);
					let idList = this.plugin.vika.datasheetList.map((item) => item.id);
					let datasheetList = this.plugin.settings.datasheetList 
					let tmpList = [];
					for(let i = 0; i < nameList.length; i++){
						let tmp = datasheetList.find((item) => item.id == idList[i]);
						if(!tmp){
							tmp = DEFAULT_CUSTOM_FIELD;
						}
						tmp.id = idList[i];
						tmp.name = nameList[i];
						tmpList.push(tmp);
					}
					this.plugin.settings.datasheetList = tmpList;
				}
			).then(() => {
				containerEl.createEl('h3', {text: 'Datasheet Settings'});
				for(let dst of this.plugin.settings.datasheetList){
					containerEl.createEl('h4', {text: dst.name});
					new Setting(containerEl)
						.setName('Update Field')
						.setDesc("自定义更新字段与默认值")
						.addTextArea(text => text
							.setPlaceholder("")
							.setValue(JSON.stringify(dst.updateField))
							.onChange(async (value) => {
								try{								
									dst.updateField = JSON.parse(value);
									text.inputEl.style.border = "1px solid green";
									await this.plugin.saveSettings();
								} catch (e) {
									text.inputEl.style.border = "1px solid red";
								}

							}));
					new Setting(containerEl)
						.setName('Recover Field')
						.setDesc("自定义下载字段")
						.addTextArea(text => text
							.setPlaceholder("")
							.setValue(JSON.stringify(dst.recoverField))
							.onChange(async (value) => {
								try{								
									dst.recoverField = JSON.parse(value);
									text.inputEl.style.border = "1px solid green";
									await this.plugin.saveSettings();
								} catch (e) {
									text.inputEl.style.border = "1px solid red";
								}
							}));
			}})
			.catch(e => new Notice(e))});
	}
}
