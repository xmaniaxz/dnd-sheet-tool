import { Client, TablesDB, ID, Query, Account, Storage, Avatars } from 'appwrite';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const databases = new TablesDB(client);
export const account = new Account(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
export const CHARACTERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CHARACTERS_COLLECTION_ID!; // Your table ID

export { ID, Query, client };
