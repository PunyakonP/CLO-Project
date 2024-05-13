const configSFTP = {
	'host': process.env.SFTP_HOST,
	'port': process.env.SFTP_PORT,
	'username': process.env.SFTP_USERNAME,
	'password': process.env.SFTP_PASSWORD,
	'retries': 3,
}

module.exports = configSFTP