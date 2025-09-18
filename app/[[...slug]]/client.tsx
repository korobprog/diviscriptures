'use client'

import React from 'react'
import Index from '../components/Index'

// Simple NotFound component
const SimpleNotFound = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>404</h1>
        <p style={{ fontSize: '1.25rem', color: '#666' }}>Page not found</p>
        <a href="/" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
          Return to Home
        </a>
      </div>
    </div>
  );
};

export function ClientOnly() {
  return <Index />
}
