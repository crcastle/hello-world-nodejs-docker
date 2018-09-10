const util = require('util');
const lookup = util.promisify(require('dns').lookup);
const fetch = require('node-fetch');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const LOCATION = process.env.LOCATION || 'an unknown location'

app.get('/', (req, res) => res.send(`Hello World from ${LOCATION}!`));

app.get('/test', async (req, res) => {
  const domain = req.query.domain;
  if (!domain) return res.status(400).json({'status': 'error', 'message': 'Must specify domain query string parameter.'});
  
  let ipAddress;
  try {
    ipAddress = await lookup(domain);
  } catch {
    return res.status(200).json({'status': 'ok', 'message': 'Domain not found'});
  }

  let fetchResponse;
  try {
    fetchResponse = await fetch(`http://${domain}/`, { timeout: 2000 });
  } catch {
    return res.status(200).json({'status': 'ok', 'message': 'IP address unreachable'});
  }

  const text = await fetchResponse.text();

  if (fetchResponse.ok) {
    return res.status(200).json({'status': 'ok', 'message': text, 'ipAddress': ipAddress})
  } else if (fetchResponse.status === 404) {
    return res.status(200).json({'status': 'ok', 'message': `No app found at ${domain}`});
  } else {
    return res.status(500).json({'status': 'error', 'message': 'Unknown error'});
  }
  
})

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
