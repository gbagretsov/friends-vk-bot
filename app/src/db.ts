import {Client, QueryResult} from 'pg';

async function getClient(): Promise<Client> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
}

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
