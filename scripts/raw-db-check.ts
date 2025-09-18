#!/usr/bin/env tsx

/**
 * Raw database check for parse records
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function rawDbCheck() {
  console.log('🔍 Raw Database Check...\n');

  try {
    // Raw SQL query to get parse records
    const parseRecords = await prisma.$queryRaw`
      SELECT 
        id,
        "textType",
        "totalVerses",
        "totalErrors",
        success,
        results,
        "createdAt",
        "updatedAt"
      FROM parse_records 
      ORDER BY "createdAt" DESC 
      LIMIT 5
    ` as any[];

    console.log(`📊 Found ${parseRecords.length} parse records:\n`);

    parseRecords.forEach((record, index) => {
      console.log(`${index + 1}. ${record.textType.toUpperCase()} (${record.createdAt})`);
      console.log(`   ID: ${record.id}`);
      console.log(`   Total Verses: ${record.totalVerses}`);
      console.log(`   Total Errors: ${record.totalErrors}`);
      console.log(`   Success: ${record.success}`);
      console.log(`   Results length: ${record.results ? record.results.length : 0} characters`);
      
      if (record.results) {
        console.log(`   Results preview: ${record.results.substring(0, 200)}...`);
        
        // Try to parse as JSON
        try {
          const parsed = JSON.parse(record.results);
          console.log(`   Parsed results type: ${Array.isArray(parsed) ? 'Array' : typeof parsed}`);
          if (Array.isArray(parsed)) {
            console.log(`   Array length: ${parsed.length}`);
            if (parsed.length > 0) {
              console.log(`   First item keys: ${Object.keys(parsed[0] || {}).join(', ')}`);
            }
          } else if (typeof parsed === 'object') {
            console.log(`   Object keys: ${Object.keys(parsed).join(', ')}`);
          }
        } catch (e) {
          console.log(`   JSON parse error: ${e.message}`);
        }
      }
      console.log('');
    });

    // Check verses table
    console.log('\n📚 Verses Table:');
    const verses = await prisma.$queryRaw`
      SELECT 
        id,
        title,
        chapter,
        "verseNumber",
        source,
        language,
        "createdAt"
      FROM verses 
      ORDER BY "createdAt" DESC 
      LIMIT 10
    ` as any[];

    console.log(`Found ${verses.length} verses:\n`);

    verses.forEach((verse, index) => {
      console.log(`${index + 1}. ${verse.title} - Ch.${verse.chapter}, V.${verse.verseNumber}`);
      console.log(`   ID: ${verse.id}`);
      console.log(`   Source: ${verse.source}`);
      console.log(`   Language: ${verse.language}`);
      console.log(`   Created: ${verse.createdAt}`);
      console.log('');
    });

    // Check for any successful parse records
    console.log('\n✅ Successful Parse Records:');
    const successfulRecords = await prisma.$queryRaw`
      SELECT 
        "textType",
        "totalVerses",
        "totalErrors",
        "createdAt"
      FROM parse_records 
      WHERE success = true
      ORDER BY "createdAt" DESC
    ` as any[];

    if (successfulRecords.length === 0) {
      console.log('❌ No successful parse records found');
    } else {
      console.log(`Found ${successfulRecords.length} successful parse records:`);
      successfulRecords.forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.textType.toUpperCase()} - ${record.totalVerses} verses, ${record.totalErrors} errors (${record.createdAt})`);
      });
    }

  } catch (error) {
    console.error('❌ Error in raw database check:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
rawDbCheck();
