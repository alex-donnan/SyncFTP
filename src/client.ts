import Client from 'ssh2-sftp-client';

export default class SFTPClient {
  constructor() {
    this.client = new Client();
  }

  async connect(options) {
    console.log(`Connecting to ${options.host}:${options.port}`);
    try {
      await this.client.connect(options);
    } catch (err) {
      console.log('Failed to connect:', err);
      return(`Failed to connect:\n${err}`);
    }
    return('Connected to SFTP');
  }

  async disconnect() {
    console.log(`Disconnecting from SFTP.`);
    await this.client.end();
    return 'Disconnected from SFTP';
  }

  async listFiles(remoteDir, fileGlob) {
    let fileObjects;
    try {
      fileObjects = await this.client.list(remoteDir, fileGlob);
    } catch (err) {
      console.log('Listing failed:', err);
    }

    var fileNames = [];

    for (const file of fileObjects) {
      if (file.type === 'd') {
        console.log(`${new Date(file.modifyTime).toISOString()} PRE ${file.name}`);
        fileNames.push({
          'name': file.name,
          'mtime': file.modifyTime,
          'type': file.type,
          'size': file.size,
          'path': remoteDir
        });
        
        let subFiles = await this.listFiles(`${remoteDir}/${file.name}`);
        fileNames = fileNames.concat(subFiles);
      } else {
        console.log(`${new Date(file.modifyTime).toISOString()} ${file.size} ${file.name}`);
        fileNames.push({
          'name': file.name,
          'mtime': file.modifyTime,
          'type': file.type,
          'size': file.size,
          'path': remoteDir
        });
      }      
    }

    return fileNames;
  }

  async uploadFile(localFile, remoteFile) {
    console.log(`Uploading ${localFile} to ${remoteFile}`);
    try {
      await this.client.put(localFile, remoteFile);
    } catch (err) {
      console.error('Uploading failed:', err);
      return(`Uploading failed:\n${err}`);
    }
    return `Uploading success for\n${localFile}`;
  }

  async downloadFile(remoteFile, localFile) {
    console.log(`Downloading ${remoteFile} to ${localFile}`);
    try {
      await this.client.get(remoteFile, localFile);
    } catch (err) {
      console.error('Downloading failed:', err);
      return(`Downloading failed:\n${err}`);
    }
    return `Downloading success for\n${localFile}`;
  }

  async makeDir(remoteDir) {
    console.log(`Creating directory ${remoteDir}`);
    try {
      await this.client.mkdir(remoteDir, true);
    } catch (err) {
      console.error('Failed to create directory:', err);
      return(`Failed to make directory:\n${err}`);
    }
    return `Successfully made directory:\n${remoteDir}`;
  }

  async removeDir(remoteDir) {
    console.log(`Deleting directory ${remoteDir}`);
    try {
      await this.client.rmdir(remoteDir, true);
    } catch (err) {
      console.error('Failed to remove directory:', err);
      return(`Failed to remove directory:\n${err}`);
    }
    return `Successfully removed directory:\n${remoteDir}`;

  }

  async deleteFile(remoteFile) {
    console.log(`Deleting ${remoteFile}`);
    try {
      await this.client.delete(remoteFile);
    } catch (err) {
      console.error('Deleting failed:', err);
      return(`Deleting failed:\n${err}`);
    }
    return `Delete success for\n${remoteFile}`;
  }

  async fileExists(remoteFile) {
    console.log(`Checking if ${remoteFile} exists`);
    let exists = false;
    try {
      exists = await this.client.exists(remoteFile);
    } catch (err) {
      console.error('Exists check failed:', err);
      return(`Exists check failed:\n${err}`);
    }
    return exists;
  }
}