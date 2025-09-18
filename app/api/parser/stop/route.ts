import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Global variable to track parsing state
let isParsingActive = false;
let currentParseId: string | null = null;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Stop parsing
    isParsingActive = false;
    currentParseId = null;

    return NextResponse.json({
      success: true,
      message: 'Parsing stopped successfully',
      parseId: currentParseId
    });

  } catch (error) {
    console.error('Error stopping parser:', error);
    return NextResponse.json(
      { error: 'Failed to stop parsing' },
      { status: 500 }
    );
  }
}

// Export functions to control parsing state
export function setParsingActive(active: boolean, parseId?: string) {
  isParsingActive = active;
  if (parseId) {
    currentParseId = parseId;
  }
}

export function getParsingState() {
  return {
    isActive: isParsingActive,
    parseId: currentParseId
  };
}