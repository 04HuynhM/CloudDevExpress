const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json);


module.exports = router;