// scripts/importKanjiData.ts
// Migrates kanji data from old kanjiDatabase.ts to new PostgreSQL schema

import { Pool } from 'pg';
import { kanjiDatabase, KanjiData, GenderAssociation } from '../src/data/kanjiDatabase';

// Mapping from old system to new motivation affinities
// Based on actual types found in kanjiDatabase.ts
const OCCUPATION_TO_MOTIVATION: Record<string, Partial<Record<string, number>>> = {
  'BUSINESS_OWNER': { dominance: 8, stability: 6, freedom: 5 },
  'CREATIVE': { creative: 10, freedom: 8 },
  'EDUCATION': { knowledge: 8, belonging: 7 },
  'MEDICAL': { knowledge: 8, belonging: 9 },
  'TECHNICAL': { knowledge: 9, creative: 6 },
  'SALES': { belonging: 7, dominance: 6 },
  'SERVICE': { belonging: 9, stability: 6 },
  'CLERICAL': { stability: 8, knowledge: 5 },
  'STUDENT': { knowledge: 7, belonging: 5 },
  'HOMEMAKER': { belonging: 8, stability: 7 },
};

const HOBBY_TO_MOTIVATION: Record<string, Partial<Record<string, number>>> = {
  'ARTS': { creative: 10, freedom: 7 },
  'COOKING': { creative: 7, belonging: 5 },
  'MAKING': { creative: 8, stability: 6 },
  'SPORTS': { dominance: 7, freedom: 6 },
  'OUTDOOR': { freedom: 9, stability: 5 },
  'TRAVEL': { freedom: 9, knowledge: 6 },
  'CULTURE': { knowledge: 9, creative: 6 },
  'SOCIAL': { belonging: 9 },
};

const GENDER_TO_MASCULINITY: Record<GenderAssociation, number> = {
  'MASCULINE': 8,
  'NEUTRAL': 0,
  'FEMININE': -8
};

const pool = new Pool({
  user: process.env.DB_USER || 'miyagawakiyomi',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'yourkanjiname',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function importKanjiData() {
  console.log('🚀 Starting kanji data import...');

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const [kanjiChar, data] of Object.entries(kanjiDatabase)) {
    try {
      // Calculate motivation affinities
      const affinities: Record<string, number> = {
        knowledge: 0,
        creative: 0,
        belonging: 0,
        dominance: 0,
        stability: 0,
        freedom: 0
      };

      // Add affinities from occupations
      if (data.occupationTypes) {
        for (const occ of data.occupationTypes) {
          const motivations = OCCUPATION_TO_MOTIVATION[occ.type];
          if (motivations) {
            for (const [motivation, value] of Object.entries(motivations)) {
              affinities[motivation] = Math.max(affinities[motivation], value);
            }
          }
        }
      }

      // Add affinities from hobbies
      if (data.hobbyTypes) {
        for (const hobby of data.hobbyTypes) {
          const motivations = HOBBY_TO_MOTIVATION[hobby.type];
          if (motivations) {
            for (const [motivation, value] of Object.entries(motivations)) {
              affinities[motivation] = Math.max(affinities[motivation], value);
            }
          }
        }
      }

      // Determine gender category and masculinity score
      let genderCategory = 'NEUTRAL';
      let masculinityScore = 0;

      if (data.genderAssociation === 'MASCULINE') {
        genderCategory = 'MASCULINE';
        masculinityScore = 8;
      } else if (data.genderAssociation === 'FEMININE') {
        genderCategory = 'FEMININE';
        masculinityScore = -8;
      }

      // Get pronunciations (placeholder - would need actual data)
      const pronunciationOn: string[] = [];
      const pronunciationKun: string[] = [];

      // Insert into database
      await pool.query(`
        INSERT INTO kanji_database (
          kanji_char,
          meaning_en,
          meaning_ja,
          pronunciation_on,
          pronunciation_kun,
          gender_category,
          masculinity_score,
          knowledge_affinity,
          creative_affinity,
          belonging_affinity,
          dominance_affinity,
          stability_affinity,
          freedom_affinity,
          stroke_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (kanji_char) DO UPDATE SET
          meaning_en = EXCLUDED.meaning_en,
          meaning_ja = EXCLUDED.meaning_ja,
          gender_category = EXCLUDED.gender_category,
          masculinity_score = EXCLUDED.masculinity_score,
          knowledge_affinity = EXCLUDED.knowledge_affinity,
          creative_affinity = EXCLUDED.creative_affinity,
          belonging_affinity = EXCLUDED.belonging_affinity,
          dominance_affinity = EXCLUDED.dominance_affinity,
          stability_affinity = EXCLUDED.stability_affinity,
          freedom_affinity = EXCLUDED.freedom_affinity,
          updated_at = NOW()
      `, [
        kanjiChar,
        data.meaning.en,
        data.meaning.ja,
        pronunciationOn,
        pronunciationKun,
        genderCategory,
        masculinityScore,
        affinities.knowledge,
        affinities.creative,
        affinities.belonging,
        affinities.dominance,
        affinities.stability,
        affinities.freedom,
        kanjiChar.length // Placeholder for stroke count
      ]);

      imported++;

      if (imported % 100 === 0) {
        console.log(`✅ Imported ${imported} kanji...`);
      }

    } catch (error) {
      console.error(`❌ Error importing kanji ${kanjiChar}:`, error);
      errors++;
    }
  }

  console.log('\n📊 Import Summary:');
  console.log(`✅ Successfully imported: ${imported}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);

  // Show some sample creative kanji
  const result = await pool.query(`
    SELECT kanji_char, meaning_ja, meaning_en, creative_affinity, gender_category
    FROM kanji_database
    WHERE creative_affinity >= 8
    ORDER BY creative_affinity DESC
    LIMIT 10
  `);

  console.log('\n🎨 Top 10 Creative Kanji:');
  result.rows.forEach(row => {
    console.log(`${row.kanji_char} (${row.meaning_ja}) - Creative: ${row.creative_affinity}`);
  });

  await pool.end();
  console.log('\n✨ Import completed!');
}

// Run the import
importKanjiData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});