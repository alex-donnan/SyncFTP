# SyncFTP

This Obsidian.md plugin allows users to sync files to their personal FTP server.

This plugin depends on [ssh2-sftp-client](https://www.npmjs.com/package/ssh2-sftp-client) to allow for secure file transfer. 

### Use
Prior to installation, create a containing folder on the SFTP for your vaults, along with a folder for each vault you would like to sync. (This will be updated in future versions.)

Once installed, an additional settings tab for SyncFTP will have been added. There you will need to provide:
- Host URL
- Host PORT
- Username
- Password
- Path to vault directory on SFTP: The vault directory will be the base directory for ALL vaults. 
- Notification toggle: Certain Notices will remain, but verbose information Notices will be disabled
- Download on open toggle: Allows you to download work from the SFTP on open.

When you wish to sync you can either push or pull files to the SFTP using:
1. Icons (up and down arrow) on the left toolbar
2. Commands (CTRL-P), which will allow you to set a keyboard shortcut as desired

This process is destructive on the SFTP, and moves local files to your .trash folder.

### Questions
If you have any questions or requests, please open a GitHub issue in this repository!
