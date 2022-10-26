import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { MyVika } from "utils/vika";
import { MyNote, MyObsidian } from "utils/obsidian";

// Remember to rename these classes and interfaces!

interface VikaSyncSettings {
	token: string;
	datasheet: string;
	view: string;
	customUpdateFields: string;    // 指定frontmatter中需要上传的字段
	customRecoverFields: string;   // 指定vika中需要下载的字段，其中uid，tags，aliases，vikaLink不需要指定
}

const DEFAULT_SETTINGS: VikaSyncSettings = {
	token: "",
	datasheet: "",
	view: "",
	customUpdateFields: JSON.stringify({"type": "笔记", "description": []}),
	customRecoverFields: JSON.stringify(["type", "description"])
}

export default class MyPlugin extends Plugin {
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
			name: 'Create Record',
			callback: () => {
				this.ob.createRecordInThisPage().then(res=> {
					res?.success?new Notice("Record created"):new Notice("Record created failed");
		})}});
		this.addCommand({
			id: 'vika-sync-update-record',
			name: 'Update Record',
			callback: () => {
				this.ob.updateRecordInThisPage().then(res=> {
					res?.success?new Notice("Record updated"):new Notice("Record updated failed");
		})}});
		this.addCommand({
			id: 'vika-sync-update-record-in-folder',
			name: 'Update Record in Folder',
			callback: () => {
				new Notice("start updating");
				this.ob.updateRecordInThisFolder()
				new Notice("update finished");
			}
		});
		this.addCommand({
			id: 'vika-sync-all-record',
			name: 'Update All Record',
			callback: () => {
				new Notice("start updating")
				this.ob.updateAllRecord();
				new Notice("update finished")
		}
		});
		this.addCommand({
			id: 'vika-sync-delete-record',
			name: 'Delete Record',
			callback: () => {
				this.ob.deleteRecordAndThisPage().then(res=> {
					res === true?new Notice("Record deleted"):new Notice("Record deleted failed");
				})
		}
		});
		this.addCommand({
			id: 'vika-sync-get-record',
			name: 'Get Record',
			callback: () => {
				this.ob.recoverFromRecord().then(res=> {
					res?.success?new Notice("Record recovered"):new Notice("Record recovered failed");
		})}});

		this.addSettingTab(new SettingTab(this.app, this));
	}


	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.vika = new MyVika(this.settings.token, this.settings.datasheet, this.settings.view);
		this.ob = new MyObsidian(this.app, this.vika);
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
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Vika Sync Settings'});

		new Setting(containerEl)
			.setName('Token')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.token)
				.onChange(async (value) => {
					this.plugin.settings.token = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Datasheet')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.datasheet)
				.onChange(async (value) => {
					this.plugin.settings.datasheet = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('View')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.view)
				.onChange(async (value) => {
					this.plugin.settings.view = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('自定义上传字段与其默认值')
			.addTextArea(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.customUpdateFields)
				.onChange(async (value) => {
					try {
						JSON.parse(value);
						this.plugin.settings.customUpdateFields = value;
						await this.plugin.saveSettings();
					}
					catch (e) {
						new Notice("字段格式错误");
					}}));
		new Setting(containerEl)
		.setName('自定义下载字段')
		.addTextArea(text => text
			.setPlaceholder('')
			.setValue(this.plugin.settings.customRecoverFields)
			.onChange(async (value) => {
				try {
					JSON.parse(value);
					this.plugin.settings.customRecoverFields = value;
					await this.plugin.saveSettings();
				}
				catch (e) {
					new Notice("字段格式错误");
				}}));		
	}
}
