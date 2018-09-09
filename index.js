const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const LOCATION = process.env.LOCATION || 'an unknown location'

app.get('/', (req, res) => res.send(`Hello World from ${LOCATION}!`));

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
