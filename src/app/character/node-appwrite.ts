import { Client,TablesDB,Query ,Account } from 'node-appwrite';
export const client = new Client();

client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string) // Replace with your Appwrite endpoint
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string) // Replace with your project ID
    .setKey(process.env.NEXT_PUBLIC_APPWRITE_API_KEY as string) // Replace with your secret API key
    .setSession('current')

export const account = new Account(client);
export const tablesDB = new TablesDB(client);
export { ID } from 'node-appwrite';


export async function GetSpellsFromTable()
{
    const result  = await tablesDB.listRows({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
        tableId: process.env.NEXT_PUBLIC_APPWRITE_SPELLS_COLLECTION_ID as string,
        queries: [Query.limit(900)]
    })
    
    // Pluck only the fields needed for the Spell type
    const spells = result.rows.map(row => {
        // Convert level to number, handle various formats
        let level = 0;
        if (typeof row.SpellLevel === 'number') {
            level = row.SpellLevel;
        } else if (typeof row.SpellLevel === 'string') {
            // Handle "Cantrip" or "0" or "1st" etc
            if (row.SpellLevel.toLowerCase().includes('cantrip')) {
                level = 0;
            } else {
                level = parseInt(row.SpellLevel) || 0;
            }
        }
        
        return {
            name: row.SpellName || '',
            level: level,
            school: row.School || '',
            source: row.Source || '',
            castingTime: row.CastingTime || '',
            range: row.Range || '',
            components: row.Components || '',
            duration: row.Duration || '',
            description: row.Description || '',
            classes: row.Classes || row.Class || ''
        };
    });
    
    return spells;
}
