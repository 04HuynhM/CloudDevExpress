const cors = require('cors');
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bodyParser = require('body-parser');

const app = express();

app.use(cors);
app.use(bodyParser.json);

module.exports = router;

