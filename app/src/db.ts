import {Client, QueryResult, types} from 'pg';

types.setTypeParser(types.builtins.INT8, val => parseInt(val, 10));

export const DUPLICATE_KEY_PG_ERROR = '23505';

async function getClient(): Promise<Client> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  return client;
}

async function query<T>(query: string): Promise<QueryResult<T>> {
  const client = await getClient();
  try {
    return await client.query(query);
  } finally {
    await client.end();
  }
}

export default {
  query,
};
