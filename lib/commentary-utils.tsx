import React from 'react';

/**
 * Utility function to process commentary text and highlight Sanskrit quotes
 */
export function processCommentaryText(commentary: string): React.ReactNode {
  if (!commentary) return null;

  // Known Sanskrit quotes that should be centered
  const sanskritQuotes = [
    'йасйа̄сти бхактир бхагаватй акин̃чана̄сарваир гун̣аис татра сама̄сате сура̄х̣хара̄в абхактасйа куто махад-гун̣а̄мано-ратхена̄сати дха̄вато бахих̣',
    // Add more Sanskrit quotes here as needed
  ];

  // Split commentary by Sanskrit quotes
  let processedText = commentary;
  const parts: Array<{ text: string; isSanskrit: boolean }> = [];

  // Find and extract Sanskrit quotes
  for (const quote of sanskritQuotes) {
    if (processedText.includes(quote)) {
      const beforeQuote = processedText.substring(0, processedText.indexOf(quote));
      const afterQuote = processedText.substring(processedText.indexOf(quote) + quote.length);
      
      if (beforeQuote.trim()) {
        parts.push({ text: beforeQuote.trim(), isSanskrit: false });
      }
      
      parts.push({ text: quote, isSanskrit: true });
      
      processedText = afterQuote;
    }
  }

  // Add remaining text
  if (processedText.trim()) {
    parts.push({ text: processedText.trim(), isSanskrit: false });
  }

  // If no Sanskrit quotes found, return original text
  if (parts.length === 0) {
    return <span>{commentary}</span>;
  }

  // Render parts with appropriate styling
  return (
    <>
      {parts.map((part, index) => {
        if (part.isSanskrit) {
          return (
            <div key={index} className="sanskrit-quote">
              {part.text}
            </div>
          );
        } else {
          return (
            <span key={index}>
              {part.text}
              {index < parts.length - 1 && ' '}
            </span>
          );
        }
      })}
    </>
  );
}

/**
 * Check if commentary contains Sanskrit quotes
 */
export function hasSanskritQuotes(commentary: string): boolean {
  const sanskritQuotes = [
    'йасйа̄сти бхактир бхагаватй акин̃чана̄сарваир гун̣аис татра сама̄сате сура̄х̣хара̄в абхактасйа куто махад-гун̣а̄мано-ратхена̄сати дха̄вато бахих̣',
  ];

  return sanskritQuotes.some(quote => commentary.includes(quote));
}
