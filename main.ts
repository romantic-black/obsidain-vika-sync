import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { MyVika } from "utils/vika";
import { MyNote, MyObsidian } from "utils/obsidian";

// Remember to rename these classes and interfaces!

interface VikaSyncSettings {
	token: string;
	datasheet: string;
	view: string;
	updateField: any;
	recoverField: any;
}

const DEFAULT_SETTINGS: VikaSyncSettings = {
	token: "",
	datasheet: "",
	view: "",
	updateField: {
			"type": "笔记", 
			"description": []
	},
	recoverField: {"type": ""}
}

export default class VikaSyncPlugin extends Plugin {
	settings: VikaSyncSettings;
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
				this.ob.deleteRecordAndThisPage().then(res=> {
					res === true?new Notice("Record deleted"):new Notice("Record delete failed");
				})
		}
		});
		this.addCommand({
			id: 'vika-sync-recover-note',
			name: 'Recover this Note from Record',
			callback: () => {
				this.ob.recoverFromRecord()
			}});

		this.addSettingTab(new SettingTab(this.app, this));
	}


	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.vika = new MyVika(this.settings.token, this.settings.datasheet, this.settings.view);
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

		new Setting(containerEl)
			.setName('Token: 从 vika 的 API 页面获取')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.token)
				.onChange(async (value) => {
					this.plugin.settings.token = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Datasheet: 从 vika 的行链接中获取, 形如 dstbcfEH6FLs45VZfi')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.datasheet)
				.onChange(async (value) => {
					this.plugin.settings.datasheet = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('View: 从 vika 的行链接中获取, 形如 viwayRfjHdoW1')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.view)
				.onChange(async (value) => {
					this.plugin.settings.view = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('自定义上传字段: 字段会从 frontmatter 上传至 vika, 同时具有默认值')
			.addText(text => text
				.setPlaceholder("")
				.setValue(JSON.stringify(this.plugin.settings.updateField))
				.onChange(async (value) => {
					try {
						let json = JSON.parse(value);
						this.plugin.settings.updateField = json;
						text.inputEl.style.border = "1px solid green";
						await this.plugin.saveSettings();
					}
					catch (e) {
						text.inputEl.style.border = "1px solid red";
					}}));	

		new Setting(containerEl)
			.setName('自定义下载字段: 字段会被下载到 frontmatter')
			.addText(text => text
				.setPlaceholder("")
				.setValue(JSON.stringify(this.plugin.settings.recoverField))
				.onChange(async (value) => {
					try {
						let json = JSON.parse(value);
						this.plugin.settings.recoverField = json;
						text.inputEl.style.border = "1px solid green";
						await this.plugin.saveSettings();
					}
					catch (e) {
						text.inputEl.style.border = "1px solid red";
					}}));
	}
}
