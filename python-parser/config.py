"""
Configuration for Python parser
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://user:password@localhost:5432/vrinda_sangha')

# Parser configuration
PARSER_CONFIG = {
    'max_concurrency': 3,
    'delay_between_requests': 2.0,  # seconds
    'max_retries': 3,
    'timeout': 30,
    'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

# Vedabase.io URLs
VEDABASE_BASE_URL = 'https://vedabase.io'
VEDABASE_URLS = {
    'bg': {
        'base_url': f'{VEDABASE_BASE_URL}/ru/library/bg/',
        'chapters': 18,
        'name': 'Бхагавад-гита',
        'url_structure': 'chapter/verse',  # bg/1/1/
        'has_verses': True
    },
    'sb': {
        'base_url': f'{VEDABASE_BASE_URL}/ru/library/sb/',
        'chapters': 12,
        'name': 'Шримад-Бхагаватам',
        'url_structure': 'canto/chapter/verse',  # sb/1/1/1/
        'has_verses': True,
        'cantos': 12
    },
    'cc': {
        'base_url': f'{VEDABASE_BASE_URL}/ru/library/cc/',
        'chapters': 17,
        'name': 'Шри Чайтанья-чаритамрита',
        'url_structure': 'part/chapter/verse',  # cc/adi/1/1/
        'has_verses': True,
        'parts': {
            'adi': {'name': 'Ади-лила', 'chapters': 17},
            'madhya': {'name': 'Мадхья-лила', 'chapters': 25},
            'antya': {'name': 'Антья-лила', 'chapters': 20}
        }
    }
}

# Logging configuration
LOGGING_CONFIG = {
    'level': 'INFO',
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'file': 'parser.log'
}
