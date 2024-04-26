const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require('morgan');
const Router = require('./routes/leadConversion');
const hralthCheck = require('./routes/root');
const PORT = process.env.PORT || 3000;
const bodyParser = require('body-parser');


const app = express();
app.use(morgan(':method :url/:remote-addr ▶ :status 💻 :user-agent (⌚ :response-time ms)'));

app.use(cors({
  origin: process.env.WHITELIST_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

app.use('/', hralthCheck);
app.use('/api', Router);

app.use(helmet())

app.listen(PORT,() => {
  console.log(`Server is started with port http://localhost:${PORT}`)
})
