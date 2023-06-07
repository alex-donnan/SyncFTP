import { Plugin, TFolder, TFile } from 'obsidian';
import CredentialTab from './src/credential';
import SFTPClient from './src/client';

interface SyncFTPSettings {
	url: string;
	port: number;
	username: string;
	password: string;
	vault_path: string;
	notify: boolean;
}

const DEFAULT_SETTINGS: SyncFTPSettings = {
	url: '',
	port: 22,
	username: '',
	password: '',
	vault_path: './obsidian/',
	notify: true,
}

export default class SyncFTP extends Plugin {
	settings: SyncFTPSettings;
	client: SFTPClient;

	async onload() {
		await this.loadSettings();

		const client = new SFTPClient();

		const syncUpload = this.addRibbonIcon('arrow-up', 'Upload to FTP', async (evt: MouseEvent) => {
			if (this.settings.url !== '') {
				new Notice(`Connecting to SFTP for file sync:\n${this.settings.url}:${this.settings.port}\n${this.settings.username}`);
				try {
					let conn = await client.connect({
						host: this.settings.url,
						port: this.settings.port,
						username: this.settings.username,
						password: this.settings.password
					});

					if (this.settings.notify) new Notice(conn);

					let rem_path = this.settings.vault_path + this.app.vault.getName();
					let rem_list = await client.listFiles(rem_path);
					let loc_path = this.app.vault.adapter.basePath;
					let loc_list = this.app.vault.getAllLoadedFiles();

					for (const rem_file of rem_list) {
						let match = loc_list.find(file => file.name === rem_file.name);

						try {
							if (!match) {
								let sync = '';
								if (rem_file.type === 'd') {
									sync = await client.removeDir(`${rem_file.path}/${rem_file.name}`);
								} else {
									sync = await client.deleteFile(`${rem_file.path}/${rem_file.name}`);
								}

								if (this.settings.notify) new Notice(sync);
							}
						} catch (err) {
							console.error(`Error deleting ${rem_file.name}: ${err}`);
						}

					}

					for (const loc_file of loc_list) {
						let sync = '';
						if (loc_file instanceof TFolder) {
							sync = await client.makeDir(`${rem_path}/${loc_file.path}`);
						} else if (loc_file instanceof TFile) {
							sync = await client.uploadFile(`${loc_path}/${loc_file.path}`, `${rem_path}/${loc_file.path}`);
						}

						if (this.settings.notify) new Notice(sync);
					}

					let disconn = await client.disconnect();

					if (this.settings.notify) new Notice(disconn);
					else new Notice('Done!');
				} catch (err) {
					new Notice(`Failed to connect to SFTP: ${err}`);
				}
			}
		});

		const syncDownload = this.addRibbonIcon('arrow-down', 'Download from FTP', async (evt: MouseEvent) => {
			if (this.settings.url !== '') {
				new Notice(`Connecting to SFTP for file sync:\n${this.settings.url}:${this.settings.port}\n${this.settings.username}`);
				try {
					let conn = await client.connect({
						host: this.settings.url,
						port: this.settings.port,
						username: this.settings.username,
						password: this.settings.password
					});

					if (this.settings.notify) new Notice(conn);

					let rem_path = this.settings.vault_path + this.app.vault.getName();
					let rem_list = await client.listFiles(rem_path);
					let loc_path = this.app.vault.adapter.basePath;
					let loc_list = this.app.vault.getAllLoadedFiles();

					for (const loc_file of loc_list) {
						let match = rem_list.find(file => file.name === loc_file.name);

						try {
							if (!match && loc_file.path !== '/') {
								await this.app.vault.trash(loc_file, true);
								if (this.settings.notify) new Notice(`File ${loc_file.name} moved to trash.`);
							}
						} catch (err) {
							console.error(`Error moving ${loc_file.name} to trash: ${err}`);
						}
					}

					for (const rem_file of rem_list) {
						let sync = '';
						let dst_path = (rem_file.path !== rem_path) ? `${rem_file.path.replace(rem_path,'')}/`: '';

						if (rem_file.type !== 'd') {
							sync = await client.downloadFile(`${rem_file.path}/${rem_file.name}`, `${dst_path}${rem_file.name}`);
						} else {
							if (!loc_list.find(folder => folder.name === rem_file.name)) {
								await this.app.vault.createFolder(`${dst_path}${rem_file.name}/`);
							}
						}

						if (this.settings.notify) new Notice(sync);
					};

					let disconn = await client.disconnect();

					if (this.settings.notify) new Notice(disconn);
					else new Notice('Done!');
				} catch (err) {
					new Notice(`Failed to connect to SFTP: ${err}`);
				}
			}
		});

		this.addSettingTab(new CredentialTab(this.app, this));
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}