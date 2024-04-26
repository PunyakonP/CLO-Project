// SQL Server configuration
const config = {
  "user": process.env.MSSQL_USER, // Database username
  "password": process.env.MSSQL_PASSWORD, // Database password
  "server": process.env.MSSQL_HOST, // Server IP address
  "database": process.env.MSSQL_DATABASE, // Database name
  "prot": process.env.MSSQL_PORT,
  "options": {
    "encrypt": false // Disable encryption
  }
}

module.exports = config
