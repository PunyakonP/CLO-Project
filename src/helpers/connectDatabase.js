const sql = require('mssql')
const conn = require('../configs/dbMssql')

/**
 * connect to database(mssql)
 * @returns {Promise<void>}
 */
async function connectToDatabase() {
    try {
       await sql.connect(conn)

        console.log('Successfully Connected to Database.');
    } catch (error) {
        console.log(`Failed to connect database : ${error}.`);
    }
}

module.exports = {
    connectToDatabase
}