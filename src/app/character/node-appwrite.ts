import { Client,TablesDB,Query ,Account } from 'node-appwrite';
import API from "@/../public/api.json";
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


export async function UploadAllSpells() {
    
    const allSpells: { SpellName: string; School: string; CastingTime: string; Range: string; Duration: string; Components: string; Description: string; HigherLevel: string | string; Classes: string; SpellLevel: string; }[] = [];
    
    // Add cantrips (level 0)
    if (API.cantrips) {
        API.cantrips.forEach(spell => {
            if(typeof spell.higherLevel === 'object' && Array.isArray(spell.higherLevel)) {
                spell.higherLevel =  "";
            }
            allSpells.push({
                SpellName: spell.spellName.toString(),
                School: spell.school.toString(),
                CastingTime: spell.castingTime.toString(),
                Range: spell.range.toString(),
                Duration: spell.duration.toString(),
                Components: spell.components.toString(),
                Description: spell.description.toString(),
                HigherLevel: spell.higherLevel as string || '',
                Classes: Array.isArray(spell.spelllists) ? spell.spelllists.join(', ') : spell.spelllists,
                SpellLevel: 'cantrip' as string
            });
        });
    }
    
    // Add leveled spells (1-9)
    for (let level = 1; level <= 9; level++) {
        const levelKey = level.toString() as keyof typeof API;
        if (API[levelKey]) {
            API[levelKey].forEach(spell => {
                allSpells.push({
                    SpellName: spell.spellName.toString(),
                    School: spell.school.toString(),
                    CastingTime: spell.castingTime.toString(),
                    Range: spell.range.toString(),
                    Duration: spell.duration.toString(),
                    Components: spell.components.toString(),
                    Description: spell.description.toString(),
                    HigherLevel: spell.higherLevel.toString() || '',
                    Classes: Array.isArray(spell.spelllists) ? spell.spelllists.join(', ') : spell.spelllists,
                    SpellLevel: level.toString() as string
                });
            });
        }
    }
    

    
    let success = 0;
    let failed = 0;
    const errors = [];
    
    interface SpellUploadData {
        SpellName: string;
        School: string;
        CastingTime: string;
        Range: string;
        Duration: string;
        Components: string;
        Description: string;
        HigherLevel: string;
        Classes: string;
        SpellLevel: string;
    }

    interface UploadError {
        spell: string;
        error: string;
    }

    for (const spell of allSpells as SpellUploadData[]) {
        try {
            await tablesDB.createRow({
                databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
                tableId: process.env.NEXT_PUBLIC_APPWRITE_SPELLS_COLLECTION_ID as string,
                data: spell
            });
            success++;
        } catch (error: unknown) {
            failed++;
            const errorMessage: string = error instanceof Error ? error.message : String(error);
            errors.push({ spell: spell.SpellName, error: errorMessage } as UploadError);
            console.error(`✗ Failed: ${spell.SpellName}`, errorMessage);
        }
    }
    
    return { total: allSpells.length, success, failed, errors };
}

export async function DeleteAllSpells() {
    try {
        await tablesDB.deleteRows({
            databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
            tableId: process.env.NEXT_PUBLIC_APPWRITE_SPELLS_COLLECTION_ID as string,
            queries: [Query.limit(1000)]
        });
    } catch (error) {
        console.error('Error deleting spells:', error);
    }
}