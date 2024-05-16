const { ShareServiceClient } = require('@azure/storage-file-share');
const fs = require('fs');
const path = require('path');
const moment = require('moment')
const Logger = require("../helpers/Logger");


// Load environment variables
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const shareName = process.env.SHARE_NAME;

// Create a ShareServiceClient
const serviceClient = ShareServiceClient.fromConnectionString(connectionString);

async function createAndUploadFile(content, file_name) {

  // Create a new file with the provided content
  const fileName = `${file_name}_${moment().format('YYYY-MM-DDTHHmmss')}.txt`;
  
  const localFilePath = path.join(__dirname, '..', 'assets', fileName);
  await fs.writeFileSync(localFilePath, JSON.stringify(content, null, 2), 'utf8');
  Logger.info(`File ${fileName} created locally.`);

  // Upload the file to Azure File Share
  const shareClient = serviceClient.getShareClient(shareName);
  const directoryClient = shareClient.getDirectoryClient('result-leadConversion');
  const fileClient = directoryClient.getFileClient(fileName);

  const data = fs.readFileSync(localFilePath);
  await fileClient.create(data.length);
  await fileClient.uploadRange(data, 0, data.length);

  Logger.info(`${fileName} uploaded successfully.`);

  // Clean up the local file
  await fs.unlinkSync(localFilePath);
  return;
}

module.exports = { createAndUploadFile };
