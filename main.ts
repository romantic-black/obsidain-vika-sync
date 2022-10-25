import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { MyVika } from "utils/vika";
import { MyNote, MyObsidian } from "utils/obsidian";

// Remember to rename these classes and interfaces!

interface VikaSyncSettings {
	token: string;
	datasheet: string;
	view: string;
}

const DEFAULT_SETTINGS: VikaSyncSettings = {
	token: "",
	datasheet: "",
	view: ""
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
				this.ob.updateRecordInThisFolder()
		}
		});
		this.addCommand({
			id: 'vika-sync-all-record',
			name: 'Update All Record',
			callback: () => {
				this.ob.updateAllRecord()
		}
		});
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
	}
}
