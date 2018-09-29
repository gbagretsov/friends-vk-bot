const { Client } = require('pg');

module.exports = function() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: !process.env.DATABASE_URL.includes('localhost'), // На localhost без SSL
  });
  client.connect();
  return client;
};