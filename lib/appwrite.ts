import { Account, Client, TablesDB } from 'react-native-appwrite';

export const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)
  .setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PLATFORM!);

export const account = new Account(client);
export const databases = new TablesDB(client);
// export const old_databases = new Databases(client);

export const databaseId = process.env.EXPO_PUBLIC_BD_ID!;
export const habitsTableId = process.env.EXPO_PUBLIC_HABITS_TABLE_ID!;