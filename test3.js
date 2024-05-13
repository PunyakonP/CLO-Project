// Requiring modules
const express = require('express');
const app = express();
const sql = require('mssql');
const mssql = require('mssql');
require('dotenv').config()

// Get request

// Config your database credential
const config = {
    user: process.env.MSSQL_USER, // Database username
    password: process.env.MSSQL_PASSWORD, // Database password
    server: process.env.MSSQL_HOST, // Server IP address
    database: process.env.MSSQL_DATABASE, // Database name
    port: Number(process.env.MSSQL_PORT) || 1433, // Database port
    authentication: {
        type: 'default'
    },
    options: {
        encrypt: true
    }
};

async function connectAndQuery() {
    try {
        var poolConnection = await sql.connect(config);

        console.log("Reading rows from the Table...");
        var resultSet = await poolConnection.request().query(`SELECT TOP 20 pc.Name as CategoryName,
            p.name as ProductName 
            FROM [SalesLT].[ProductCategory] pc
            JOIN [SalesLT].[Product] p ON pc.productcategoryid = p.productcategoryid`);

        console.log(`${resultSet.recordset.length} rows returned.`);

        // output column headers
        var columns = "";
        for (var column in resultSet.recordset.columns) {
            columns += column + ", ";
        }
        console.log("%s\t", columns.substring(0, columns.length - 2));

        // ouput row contents from default record set
        resultSet.recordset.forEach(row => {
            console.log("%s\t%s", row.CategoryName, row.ProductName);
        });

        // close connection only when we're certain application is finished
        poolConnection.close();
    } catch (err) {
        console.error(err.message);
    }
}


app.get('/', function (req, res) {
    
});

let server = app.listen(5000, function () {
    console.log('Server is listening at port 5000...');
});
