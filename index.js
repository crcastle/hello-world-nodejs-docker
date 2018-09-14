const util = require('util');
const path = require('path');
const lookup = util.promisify(require('dns').lookup);
const BigQuery = require('@google-cloud/bigquery');
const fetch = require('node-fetch');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const LOCATION = process.env.LOCATION || 'an unknown location'

const bigQuery = new BigQuery({
  keyFilename: path.resolve('./keys/keys.json'),
});

app.get('/', (req, res) => res.send(`Hello World from ${LOCATION}!`));

app.get('/test', async (req, res) => {
  const u = requireParam('url', req, res);

  let url;
  try {
    url = new URL(u);
  } catch(e) {
    return res.status(400).json({'status': 'error', 'message': e.message});
  }
  
  let ipAddress;
  try {
    ipAddress = await lookup(url.hostname);
  } catch {
    return res.status(200).json({'status': 'ok', 'message': 'IP address not found'});
  }

  let fetchResponse;
  try {
    fetchResponse = await fetch(url.href, { timeout: 2000 });
  } catch {
    return res.status(200).json({'status': 'ok', 'message': 'Service unreachable'});
  }

  const text = await fetchResponse.text();

  if (fetchResponse.ok) {
    return res.status(200).json({'status': 'ok', 'message': text, 'ipAddress': ipAddress})
  } else if (fetchResponse.status === 404) {
    return res.status(200).json({'status': 'ok', 'message': `No app found at ${url.href}`});
  } else {
    return res.status(500).json({'status': 'error', 'message': 'Unknown error'});
  }
  
})

// POST https://www.googleapis.com/bigquery/v2/projects/projectId/queries
app.get('/commitsProxy', async (req, res) => {
  const org = requireParam('org', req, res);

  const sqlQuery = `SELECT
    COUNT(1) AS count, MAX(committer.date) AS last_commit, MIN(committer.date) AS first_commit  
    FROM \`bigquery-public-data.github_repos.commits\`,
    UNNEST(repo_name) repo_name
    WHERE STARTS_WITH(repo_name, '${org}/')
    `;

  const options = {
    query: sqlQuery,
    useLegacySql: false
  };

  let result;
  try {
    result = await bigQuery.query(options);
  } catch(e) {
    return res.status(500).json({'status': 'error', 'message': e.message});
  }

  return res.status(200).json({'status': 'ok', 'result': result[0]});
})

app.get('/commits', async (req, res) => {
  const org = requireParam('org', req, res);

  let fetchResponse;
  try {
    fetchResponse = await fetch(`http://10.142.0.8/commitsProxy?org=${org}`);
  } catch {
    return res.status(400).json({'status': 'ok', 'message': 'Service unreachable'});
  }

  const json = await fetchResponse.json();

  return res.status(200).json(json);
})

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));

function requireParam(paramName, req, res) {
  const param = req.query[paramName];
  if (!param) {
    return res.status(400).json({'status': 'error', 'message': `Must specify ${paramName} query string parameter.`});
  } else {
    return param;
  }
}
