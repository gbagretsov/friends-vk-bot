const { Client } = require('pg');

const getClient = function() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: !process.env.DATABASE_URL.includes('localhost'), // На localhost без SSL
  });
  client.connect();
  return client;
};

module.exports.query = async function(query) {
  const client = getClient();
  try {
    return await client.query(query);
  } catch (error) {
    throw error;
  } finally {
    client.end();
  }
};
