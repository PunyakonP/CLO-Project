// SQL Server configuration
const config = {
  user: process.env.DB_USER, // Database username
  password: process.env.DB_PASS, // Database password
  server: process.env.DB_HOST, // Server IP address
  database: process.env.DB_NAME, // Database name
  prot: process.env.DB_PORT,
  options: {
    encrypt: false, // Disable encryption
    instancename: process.env.DB_INSTANCE_NAME
  }
}

module.exports = config
