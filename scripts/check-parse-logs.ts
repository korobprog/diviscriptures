#!/usr/bin/env tsx

/**
 * Check parse logs and error details
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkParseLogs() {
  console.log('🔍 Checking Parse Logs and Errors...\n');

  try {
    // Get all parse records with detailed results
    const parseRecords = await prisma.parseRecord.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        initiator: {
          select: { name: true, email: true }
        }
      }
    });

    console.log(`📊 Found ${parseRecords.length} parse records\n`);

    parseRecords.forEach((record, index) => {
      console.log(`\n${index + 1}. Parse Record: ${record.textType.toUpperCase()}`);
      console.log(`   ID: ${record.id}`);
      console.log(`   Created: ${record.createdAt.toLocaleString()}`);
      console.log(`   Updated: ${record.updatedAt.toLocaleString()}`);
      console.log(`   Total Verses: ${record.totalVerses}`);
      console.log(`   Total Errors: ${record.totalErrors}`);
      console.log(`   Success: ${record.success ? '✅' : '❌'}`);
      console.log(`   Initiated by: ${record.initiator.name || record.initiator.email}`);

      if (record.results) {
        console.log(`   Results:`);
        try {
          const results = JSON.parse(record.results);
          
          if (Array.isArray(results)) {
            console.log(`     Array with ${results.length} items`);
            results.forEach((item, i) => {
              if (typeof item === 'object' && item !== null) {
                console.log(`     Item ${i + 1}:`);
                Object.entries(item).forEach(([key, value]) => {
                  if (typeof value === 'string' && value.length > 100) {
                    console.log(`       ${key}: ${value.substring(0, 100)}...`);
                  } else {
                    console.log(`       ${key}: ${value}`);
                  }
                });
              } else {
                console.log(`     Item ${i + 1}: ${item}`);
              }
            });
          } else if (typeof results === 'object' && results !== null) {
            console.log(`     Object with keys: ${Object.keys(results).join(', ')}`);
            Object.entries(results).forEach(([key, value]) => {
              if (typeof value === 'string' && value.length > 100) {
                console.log(`     ${key}: ${value.substring(0, 100)}...`);
              } else if (Array.isArray(value)) {
                console.log(`     ${key}: Array with ${value.length} items`);
                if (value.length > 0 && typeof value[0] === 'string') {
                  console.log(`       Sample: ${value[0].substring(0, 50)}...`);
                }
              } else {
                console.log(`     ${key}: ${value}`);
              }
            });
          } else {
            console.log(`     ${results}`);
          }
        } catch (e) {
          console.log(`     Raw results: ${record.results.substring(0, 200)}...`);
        }
      } else {
        console.log(`   Results: No results data`);
      }
    });

    // Check for specific error patterns
    console.log('\n🔍 Error Analysis:');
    const errorRecords = parseRecords.filter(r => !r.success || r.totalErrors > 0);
    
    if (errorRecords.length === 0) {
      console.log('✅ No error records found');
    } else {
      console.log(`Found ${errorRecords.length} records with errors:`);
      
      errorRecords.forEach((record, index) => {
        console.log(`\n${index + 1}. ${record.textType.toUpperCase()} (${record.createdAt.toLocaleString()})`);
        console.log(`   Errors: ${record.totalErrors}`);
        console.log(`   Success: ${record.success}`);
        
        if (record.results) {
          try {
            const results = JSON.parse(record.results);
            
            // Look for error messages
            if (results.errors && Array.isArray(results.errors)) {
              console.log(`   Error messages:`);
              results.errors.slice(0, 5).forEach((error: string, i: number) => {
                console.log(`     ${i + 1}. ${error}`);
              });
              if (results.errors.length > 5) {
                console.log(`     ... and ${results.errors.length - 5} more errors`);
              }
            }
            
            // Look for failed verses
            if (results.failedVerses && Array.isArray(results.failedVerses)) {
              console.log(`   Failed verses: ${results.failedVerses.length}`);
              results.failedVerses.slice(0, 3).forEach((verse: any, i: number) => {
                console.log(`     ${i + 1}. Chapter ${verse.chapter}, Verse ${verse.verseNumber}: ${verse.error || 'Unknown error'}`);
              });
            }
            
            // Look for parser-specific errors
            if (results.parser) {
              console.log(`   Parser: ${results.parser}`);
            }
            
            if (results.stats) {
              console.log(`   Stats: ${JSON.stringify(results.stats)}`);
            }
            
          } catch (e) {
            console.log(`   Raw error data: ${record.results.substring(0, 300)}...`);
          }
        }
      });
    }

    // Summary
    console.log('\n📈 Summary:');
    const successfulParses = parseRecords.filter(r => r.success);
    const failedParses = parseRecords.filter(r => !r.success);
    const totalVerses = parseRecords.reduce((sum, r) => sum + r.totalVerses, 0);
    const totalErrors = parseRecords.reduce((sum, r) => sum + r.totalErrors, 0);

    console.log(`   Total parse attempts: ${parseRecords.length}`);
    console.log(`   Successful parses: ${successfulParses.length}`);
    console.log(`   Failed parses: ${failedParses.length}`);
    console.log(`   Total verses parsed: ${totalVerses}`);
    console.log(`   Total errors: ${totalErrors}`);
    
    if (parseRecords.length > 0) {
      const successRate = (successfulParses.length / parseRecords.length) * 100;
      console.log(`   Success rate: ${successRate.toFixed(1)}%`);
    }

  } catch (error) {
    console.error('❌ Error checking parse logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkParseLogs();
