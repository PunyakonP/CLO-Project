const Client = require("ssh2-sftp-client");
const connSFTP = require('../configs/sftp');

class SFTP {
    constructor(options) {
        this.options = options;
        this.setup();
    }

    async setup() {
        const sftp = new Client();
        this.client = await sftp.connect(this.options);
    }

    async connect() {
        try {
            if (!this.client) {
                this.setup();
            }
            return this.client;
        }
        catch (err) {
            // to do: make logging
            console.log(err);
        }
    }

    async exist(path) {
        // todo waiting path from tdem
        const checkFolderExist = await this.client.exists(path)

        if (!checkFolderExist) {
            console.log('Folder is not exist.');
            return false;
        }

        return true;
    }

    async readFile(fileName) {
        try {
            const fileRemote = await this.client.get(fileName);

            if (!fileRemote) {
                return null;
            }

            return fileName;
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = new SFTP(connSFTP)