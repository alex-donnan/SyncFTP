# SyncFTP

This Obsidian.md plugin allows users to sync files to their personal FTP server.

### Use
Once installed, an additional settings tab for SyncFTP will have been added. There you will need to provide:
- Host URL
- Host PORT
- Username
- Password
- Path to vault directory on SFTP
- Notification toggle. Certain Notices will remain, but verbose information Notices will be disabled
- Download on open toggle. Allows you to download work from the SFTP on open.

When you wish to sync you can either push or pull files to the SFTP using:
1. The icons (up and down arrow) on the left toolbar
2. The command (CTRL-P). Commands will allow you to set a hotkey as desired

This process is destructive on the SFTP, and moves local files to your .trash folder.

### Install
If you are loading the plugin in manually:
1. Open the vault folder you wish to add it to.
2. Navigate to VaultFolder/.obsidian/plugins
	- If you do not have a plugins folder, make one
3. Create a new folder SyncFTP in your plugins folder. Add the main.js and manifest.json files.
4. In settings, enable community plugins and turn on SyncFTP.
5. Follow *Use* instructions above.