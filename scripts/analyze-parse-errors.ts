#!/usr/bin/env tsx

/**
 * Analyze parse errors in detail
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeParseErrors() {
  console.log('🔍 Analyzing Parse Errors in Detail...\n');

  try {
    // Get the most recent parse record with errors
    const errorRecord = await prisma.parseRecord.findFirst({
      where: {
        OR: [
          { success: false },
          { totalErrors: { gt: 0 } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!errorRecord) {
      console.log('❌ No error records found');
      return;
    }

    console.log(`📊 Analyzing record: ${errorRecord.textType.toUpperCase()}`);
    console.log(`   ID: ${errorRecord.id}`);
    console.log(`   Created: ${errorRecord.createdAt.toLocaleString()}`);
    console.log(`   Total Verses: ${errorRecord.totalVerses}`);
    console.log(`   Total Errors: ${errorRecord.totalErrors}`);
    console.log(`   Success: ${errorRecord.success}`);

    if (errorRecord.results) {
      console.log('\n📝 Detailed Results Analysis:');
      try {
        const results = JSON.parse(errorRecord.results);
        
        if (Array.isArray(results) && results.length > 0) {
          const result = results[0];
          console.log(`   Parser: ${result.parser || 'Unknown'}`);
          console.log(`   Success: ${result.success}`);
          console.log(`   Verses: ${result.verses}`);
          console.log(`   Errors: ${result.errors}`);
          
          if (result.stats) {
            console.log('\n   📈 Statistics:');
            Object.entries(result.stats).forEach(([key, value]) => {
              console.log(`     ${key}: ${value}`);
            });
          }
          
          if (result.errors && Array.isArray(result.errors)) {
            console.log('\n   ❌ Error Details:');
            result.errors.forEach((error: string, index: number) => {
              console.log(`     ${index + 1}. ${error}`);
            });
          }
          
          if (result.failedVerses && Array.isArray(result.failedVerses)) {
            console.log('\n   📖 Failed Verses:');
            result.failedVerses.forEach((verse: any, index: number) => {
              console.log(`     ${index + 1}. Chapter ${verse.chapter}, Verse ${verse.verseNumber}`);
              if (verse.error) {
                console.log(`        Error: ${verse.error}`);
              }
              if (verse.url) {
                console.log(`        URL: ${verse.url}`);
              }
            });
          }
          
          if (result.successfulVerses && Array.isArray(result.successfulVerses)) {
            console.log(`\n   ✅ Successful Verses: ${result.successfulVerses.length}`);
            if (result.successfulVerses.length > 0) {
              console.log('   Sample successful verses:');
              result.successfulVerses.slice(0, 3).forEach((verse: any, index: number) => {
                console.log(`     ${index + 1}. Chapter ${verse.chapter}, Verse ${verse.verseNumber}`);
              });
            }
          }
          
        } else {
          console.log('   Results: Empty array or invalid format');
        }
        
      } catch (e) {
        console.log(`   Error parsing results: ${e}`);
        console.log(`   Raw results: ${errorRecord.results.substring(0, 500)}...`);
      }
    } else {
      console.log('\n❌ No results data available');
    }

    // Check if there are any verses in the database for this text type
    console.log('\n📚 Checking Database for Verses:');
    const versesInDb = await prisma.verse.findMany({
      where: {
        title: {
          contains: errorRecord.textType === 'bg' ? 'Бхагавад-гита' :
                   errorRecord.textType === 'sb' ? 'Шримад-Бхагаватам' :
                   errorRecord.textType === 'cc' ? 'Чайтанья-чаритамрита' : ''
        }
      }
    });

    console.log(`   Verses in database for ${errorRecord.textType.toUpperCase()}: ${versesInDb.length}`);
    
    if (versesInDb.length > 0) {
      console.log('   Sample verses:');
      versesInDb.slice(0, 3).forEach((verse, index) => {
        console.log(`     ${index + 1}. Chapter ${verse.chapter}, Verse ${verse.verseNumber} (${verse.source})`);
      });
    }

    // Check for common error patterns
    console.log('\n🔍 Common Error Patterns:');
    if (errorRecord.results) {
      try {
        const results = JSON.parse(errorRecord.results);
        if (Array.isArray(results) && results.length > 0 && results[0].errors) {
          const errors = results[0].errors;
          const errorPatterns = errors.reduce((acc: Record<string, number>, error: string) => {
            // Extract common error patterns
            if (error.includes('fetch')) acc['Network/Fetch errors'] = (acc['Network/Fetch errors'] || 0) + 1;
            else if (error.includes('timeout')) acc['Timeout errors'] = (acc['Timeout errors'] || 0) + 1;
            else if (error.includes('404') || error.includes('not found')) acc['404/Not found errors'] = (acc['404/Not found errors'] || 0) + 1;
            else if (error.includes('parse') || error.includes('HTML')) acc['Parsing errors'] = (acc['Parsing errors'] || 0) + 1;
            else if (error.includes('rate limit') || error.includes('too many')) acc['Rate limit errors'] = (acc['Rate limit errors'] || 0) + 1;
            else acc['Other errors'] = (acc['Other errors'] || 0) + 1;
            return acc;
          }, {});

          Object.entries(errorPatterns).forEach(([pattern, count]) => {
            console.log(`   ${pattern}: ${count} occurrences`);
          });
        }
      } catch (e) {
        console.log('   Could not analyze error patterns');
      }
    }

  } catch (error) {
    console.error('❌ Error analyzing parse errors:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeParseErrors();
