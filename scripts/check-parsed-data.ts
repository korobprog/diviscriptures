#!/usr/bin/env tsx

/**
 * Script to check what has been parsed and stored in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkParsedData() {
  console.log('🔍 Checking parsed data in database...\n');

  try {
    // Check parse records
    console.log('📊 Parse Records:');
    const parseRecords = await prisma.parseRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        initiator: {
          select: { name: true, email: true }
        }
      }
    });

    if (parseRecords.length === 0) {
      console.log('❌ No parse records found');
    } else {
      console.log(`Found ${parseRecords.length} parse records:\n`);
      parseRecords.forEach((record, index) => {
        console.log(`${index + 1}. ${record.textType.toUpperCase()} - ${record.createdAt.toLocaleString()}`);
        console.log(`   Total verses: ${record.totalVerses}`);
        console.log(`   Total errors: ${record.totalErrors}`);
        console.log(`   Success: ${record.success ? '✅' : '❌'}`);
        console.log(`   Initiated by: ${record.initiator.name || record.initiator.email}`);
        if (record.results) {
          try {
            const results = JSON.parse(record.results);
            console.log(`   Details: ${JSON.stringify(results, null, 2).substring(0, 200)}...`);
          } catch (e) {
            console.log(`   Results: ${record.results.substring(0, 100)}...`);
          }
        }
        console.log('');
      });
    }

    // Check verses by text type
    console.log('\n📚 Verses by Text Type:');
    const verseStats = await prisma.verse.groupBy({
      by: ['title'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    if (verseStats.length === 0) {
      console.log('❌ No verses found in database');
    } else {
      verseStats.forEach((stat, index) => {
        console.log(`${index + 1}. ${stat.title}: ${stat._count.id} verses`);
      });
    }

    // Check verses by chapter for each text type
    console.log('\n📖 Verses by Chapter:');
    const chapterStats = await prisma.verse.groupBy({
      by: ['title', 'chapter'],
      _count: {
        id: true
      },
      orderBy: [
        { title: 'asc' },
        { chapter: 'asc' }
      ]
    });

    const groupedByTitle = chapterStats.reduce((acc, stat) => {
      if (!acc[stat.title]) {
        acc[stat.title] = [];
      }
      acc[stat.title].push({ chapter: stat.chapter, count: stat._count.id });
      return acc;
    }, {} as Record<string, Array<{ chapter: number; count: number }>>);

    Object.entries(groupedByTitle).forEach(([title, chapters]) => {
      console.log(`\n${title}:`);
      chapters.forEach(({ chapter, count }) => {
        console.log(`  Chapter ${chapter}: ${count} verses`);
      });
    });

    // Show sample verses
    console.log('\n📝 Sample Verses:');
    const sampleVerses = await prisma.verse.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        chapter: true,
        verseNumber: true,
        sanskrit: true,
        translation: true,
        source: true,
        createdAt: true
      }
    });

    sampleVerses.forEach((verse, index) => {
      console.log(`\n${index + 1}. ${verse.title} - Chapter ${verse.chapter}, Verse ${verse.verseNumber}`);
      console.log(`   Sanskrit: ${verse.sanskrit.substring(0, 100)}...`);
      console.log(`   Translation: ${verse.translation.substring(0, 100)}...`);
      console.log(`   Source: ${verse.source}`);
      console.log(`   Created: ${verse.createdAt.toLocaleString()}`);
    });

    // Check for recent activity
    console.log('\n⏰ Recent Activity:');
    const recentVerses = await prisma.verse.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        title: true,
        chapter: true,
        verseNumber: true,
        createdAt: true
      }
    });

    if (recentVerses.length === 0) {
      console.log('❌ No verses created in the last 24 hours');
    } else {
      console.log(`Found ${recentVerses.length} verses created in the last 24 hours:`);
      recentVerses.forEach((verse, index) => {
        console.log(`  ${index + 1}. ${verse.title} - Ch.${verse.chapter}, V.${verse.verseNumber} (${verse.createdAt.toLocaleString()})`);
      });
    }

    // Check for errors in parse records
    console.log('\n⚠️  Parse Errors:');
    const errorRecords = await prisma.parseRecord.findMany({
      where: {
        OR: [
          { success: false },
          { totalErrors: { gt: 0 } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    if (errorRecords.length === 0) {
      console.log('✅ No parse errors found');
    } else {
      console.log(`Found ${errorRecords.length} records with errors:`);
      errorRecords.forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.textType.toUpperCase()} - ${record.totalErrors} errors (${record.createdAt.toLocaleString()})`);
        if (record.results) {
          try {
            const results = JSON.parse(record.results);
            if (results.errors && results.errors.length > 0) {
              console.log(`     Sample errors: ${results.errors.slice(0, 3).join(', ')}`);
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
      });
    }

  } catch (error) {
    console.error('❌ Error checking parsed data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkParsedData();
