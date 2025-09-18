import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
      city?: string | null
      language?: string | null
      timezone?: string | null
      createdAt?: string | null
      lastLoginAt?: string | null
    }
  }

  interface User {
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
  }
}
