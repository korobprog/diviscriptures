#!/usr/bin/env tsx

/**
 * Test script for Python verse parsers
 * Usage: tsx scripts/test-parser.ts [textType] [maxChapters]
 */

import { pythonParser } from '../lib/python-parser-integration';

async function testParser(textType: 'bg' | 'sb' | 'cc' = 'bg', maxChapters: number = 2) {
  console.log(`🧪 Testing Python ${textType} parser with max ${maxChapters} chapters...\n`);

  try {
    // Check Python parser availability
    console.log('📊 Checking Python parser availability...');
    const isAvailable = await pythonParser.checkAvailability();
    
    if (!isAvailable) {
      console.error('❌ Python parser is not available');
      return;
    }
    
    console.log('✅ Python parser is available');

    // Get parser status
    console.log('📊 Getting parser status...');
    const status = await pythonParser.getParserStatus();
    console.log(`Available: ${status.available}`);
    console.log(`Capabilities: ${status.capabilities.join(', ')}`);

    // Get database statistics
    console.log('📊 Getting database statistics...');
    const statsResult = await pythonParser.getDatabaseStats();
    if (statsResult.success && statsResult.data) {
      const stats = statsResult.data;
      console.log(`Total verses in database: ${stats.total_verses}`);
      console.log(`By text type:`, stats.by_text_type);
    }

    // Test parsing with limited chapters
    console.log('🔄 Starting test parsing...');
    const startTime = Date.now();
    
    const parseResult = await pythonParser.parseTextType(textType, {
      saveToDb: true,
      maxChapters: maxChapters
    });

    const duration = Date.now() - startTime;
    console.log(`\n⏱️  Parsing completed in ${Math.round(duration / 1000)} seconds`);
    
    if (parseResult.success && parseResult.data) {
      const result = parseResult.data;
      console.log(`📊 Results:`);
      console.log(`  Total verses: ${result.total_verses}`);
      console.log(`  Successful verses: ${result.successful_verses}`);
      console.log(`  Failed verses: ${result.failed_verses}`);
      console.log(`  Success rate: ${((result.successful_verses / result.total_verses) * 100).toFixed(1)}%`);
      console.log(`  Duration: ${result.duration.toFixed(2)} seconds`);

      // Show sample verses
      if (result.sample_verses && result.sample_verses.length > 0) {
        console.log('\n📖 Sample verses:');
        result.sample_verses.slice(0, 3).forEach((verse, index) => {
          console.log(`  ${index + 1}. Chapter ${verse.chapter}, Verse ${verse.verse_number}`);
          console.log(`     Sanskrit: ${verse.sanskrit.substring(0, 50)}...`);
          console.log(`     Translation: ${verse.translation.substring(0, 100)}...`);
        });
      }

      // Show errors if any
      if (result.errors && result.errors.length > 0) {
        console.log('\n⚠️  Errors:');
        result.errors.slice(0, 5).forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }
    } else {
      console.error('❌ Parsing failed:', parseResult.error);
    }

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

async function showAvailableTexts() {
  console.log('📚 Available text types:');
  
  const textTypes = [
    { value: 'bg', name: 'Бхагавад-гита', chapters: 18, estimatedVerses: 700 },
    { value: 'sb', name: 'Шримад-Бхагаватам', chapters: 12, estimatedVerses: 18000 },
    { value: 'cc', name: 'Шри Чайтанья-чаритамрита', chapters: 17, estimatedVerses: 2000 }
  ];

  for (const textType of textTypes) {
    console.log(`  ${textType.value}: ${textType.name}`);
    console.log(`    Chapters: ${textType.chapters}`);
    console.log(`    Estimated verses: ${textType.estimatedVerses}`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: tsx scripts/test-parser.ts [textType] [maxChapters]');
    console.log('');
    console.log('Arguments:');
    console.log('  textType    - bg, sb, cc (default: bg)');
    console.log('  maxChapters - maximum chapters to parse (default: 2)');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h  - show this help message');
    console.log('  --list      - list available text types');
    console.log('');
    return;
  }

  if (args.includes('--list')) {
    await showAvailableTexts();
    return;
  }

  const textType = (args[0] as 'bg' | 'sb' | 'cc') || 'bg';
  const maxChapters = parseInt(args[1]) || 2;

  if (!['bg', 'sb', 'cc'].includes(textType)) {
    console.error('❌ Invalid text type. Use: bg, sb, or cc');
    process.exit(1);
  }

  await testParser(textType, maxChapters);
}

// Run the script
main().catch(console.error);