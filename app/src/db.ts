import {Client, QueryResult, types} from 'pg';

types.setTypeParser(types.builtins.INT8, val => parseInt(val, 10));

async function getClient(): Promise<Client> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
}

// TODO: remove redundant export
export async function query<T>(query: string): Promise<QueryResult<T>> {
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
