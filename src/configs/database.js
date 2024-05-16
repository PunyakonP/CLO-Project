// SQL Server configuration

const configDB = {
  user: process.env.MSSQL_USER, // Database username
  password: process.env.MSSQL_PASSWORD, // Database password
  server: process.env.MSSQL_HOST, // Server IP address
  database: process.env.MSSQL_DATABASE, // Database name
  port: Number(process.env.MSSQL_PORT) || 1433, // Database port
  options: {
    encrypt: true, // Disable encryption
    instancename: process.env.DB_INSTANCE_NAME
  }
}

module.exports = configDB
