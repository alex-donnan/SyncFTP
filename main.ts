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
	load_sync: boolean;
}

const DEFAULT_SETTINGS: SyncFTPSettings = {
	url: '',
	port: 22,
	username: '',
	password: '',
	vault_path: './obsidian/',
	notify: true,
	load_sync: false
}

export default class SyncFTP extends Plugin {
	settings: SyncFTPSettings;
	client: SFTPClient;

	async onload() {
		await this.loadSettings();

		this.client = new SFTPClient();

		if (this.settings.load_sync) {
			this.downloadFile();
		}

		this.addCommand({
	      id: "push-to-sftp",
	      name: "Upload files to the SFTP",
	      callback: () => { this.uploadFile(); },
	    });

	    this.addCommand({
	      id: "pull-from-sftp",
	      name: "Download files from the SFTP",
	      callback: () => { this.downloadFile(); },
	    });

		const syncUpload = this.addRibbonIcon(
			'arrow-up',
			'Upload to FTP',
			() => { this.uploadFile(); });

		const syncDownload = this.addRibbonIcon(
			'arrow-down',
			'Download from FTP',
			() => { this.downloadFile(); });

		this.addSettingTab(new CredentialTab(this.app, this));
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});
	}

	async onunload() {
		await this.saveSettings();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async uploadFile() {
		if (this.settings.url !== '') {
			new Notice(`Connecting to SFTP for file sync:\n${this.settings.url}:${this.settings.port}\n${this.settings.username}`);
			try {
				let conn = await this.client.connect({
					host: this.settings.url,
					port: this.settings.port,
					username: this.settings.username,
					password: this.settings.password
				});

				if (this.settings.notify) new Notice(conn);

				let rem_path = this.settings.vault_path + this.app.vault.getName();
				let rem_list = await this.client.listFiles(rem_path);
				let loc_path = this.app.vault.adapter.basePath;
				let loc_list = this.app.vault.getAllLoadedFiles();

				for (const rem_file of rem_list) {
					let match_index = loc_list.findIndex(file => `/${file.path}` === `${rem_file.path.replace(rem_path, '')}/${rem_file.name}`);
					let match = loc_list[match_index];

					try {
						if (match) {
							if (rem_file.type === 'd' || rem_file.size === match.stat.size) {
								loc_list.splice(match_index, 1);
							}
						} else if (!match) {
							let sync = '';
							if (rem_file.type === 'd') {
								if (await this.client.fileExists(`${rem_file.path}/${rem_file.name}`)) {
									sync = await this.client.removeDir(`${rem_file.path}/${rem_file.name}`);
								}
							} else {
								if (await this.client.fileExists(`${rem_file.path}/${rem_file.name}`)) {
									sync = await this.client.deleteFile(`${rem_file.path}/${rem_file.name}`);
								}
							}

							if (this.settings.notify && sync !== '') new Notice(sync);
						}
					} catch (err) {
						console.error(`Error deleting ${rem_file.name}: ${err}`);
					}

				}

				for (const loc_file of loc_list) {
					let sync = '';
					if (loc_file instanceof TFolder && loc_file.path !== '/') {
						sync = await this.client.makeDir(`${rem_path}/${loc_file.path}`);
					} else if (loc_file instanceof TFile) {
						sync = await this.client.uploadFile(`${loc_path}/${loc_file.path}`, `${rem_path}/${loc_file.path}`);
					}

					if (this.settings.notify && sync != '') new Notice(sync);
				}

				let disconn = await this.client.disconnect();

				if (this.settings.notify) new Notice(disconn);
				else new Notice('Done!');
			} catch (err) {
				new Notice(`Failed to connect to SFTP: ${err}`);
			}
		}
	}

	async downloadFile() {
		if (this.settings.url !== '') {
			new Notice(`Connecting to SFTP for file sync:\n${this.settings.url}:${this.settings.port}\n${this.settings.username}`);
			try {
				let conn = await this.client.connect({
					host: this.settings.url,
					port: this.settings.port,
					username: this.settings.username,
					password: this.settings.password
				});

				if (this.settings.notify) new Notice(conn);

				let rem_path = this.settings.vault_path + this.app.vault.getName();
				let rem_list = await this.client.listFiles(rem_path);
				let loc_path = this.app.vault.adapter.basePath;
				let loc_list = this.app.vault.getAllLoadedFiles();

				for (const loc_file of loc_list) {
					let match_index = rem_list.findIndex(file => `${file.path.replace(rem_path, '')}/${file.name}` === `/${loc_file.path}`);
					let match = rem_list[match_index];

					try {
						let sync = '';
						if (match) {
							if (match.type === 'd' || match.size === loc_file.stat.size) {
								rem_list.splice(match_index, 1);
							}
						} else if (!match && loc_file.path !== '/') {
							await this.app.vault.trash(loc_file, true);
							sync = `Local file ${loc_file.name} moved to Obsidian trash.`;
						}

						if (this.settings.notify && sync !== '') new Notice(sync);
					} catch (err) {
						console.error(`Error moving ${loc_file.name} to trash: ${err}`);
					}
				}

				for (const rem_file of rem_list) {
					let sync = '';
					let dst_path = (rem_file.path !== rem_path) ? `${rem_file.path.replace(rem_path,'')}/`: '';

					if (rem_file.type !== 'd') {
						sync = await this.client.downloadFile(`${rem_file.path}/${rem_file.name}`, `${loc_path}${dst_path}${rem_file.name}`);
					} else {
						if (!loc_list.find(folder => folder.name === rem_file.name)) {
							if (! await this.client.fileExists(`${dst_path}${rem_file.name}/`)) {
								sync = await this.app.vault.createFolder(`${dst_path}${rem_file.name}/`);
							}
						}
					}

					if (this.settings.notify && sync !== '') new Notice(sync);
				};

				let disconn = await this.client.disconnect();

				if (this.settings.notify) new Notice(disconn);
				else new Notice('Done!');
			} catch (err) {
				new Notice(`Failed to connect to SFTP: ${err}`);
			}
		}
	}
}