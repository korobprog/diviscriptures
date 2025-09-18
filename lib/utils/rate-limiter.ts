/**
 * Rate limiter utility for controlling request frequency
 */

export interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
  delayMs?: number;
}

export class RateLimiter {
  private requests: number[] = [];
  private options: Required<RateLimiterOptions>;

  constructor(options: RateLimiterOptions) {
    this.options = {
      delayMs: 1000,
      ...options,
    };
  }

  /**
   * Check if a request can be made
   */
  canMakeRequest(): boolean {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    // Remove old requests outside the window
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);

    return this.requests.length < this.options.maxRequests;
  }

  /**
   * Record a request
   */
  recordRequest(): void {
    this.requests.push(Date.now());
  }

  /**
   * Wait if necessary to respect rate limits
   */
  async waitIfNeeded(): Promise<void> {
    if (!this.canMakeRequest()) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.options.windowMs - (Date.now() - oldestRequest);
      
      if (waitTime > 0) {
        await this.delay(waitTime);
      }
    }

    this.recordRequest();
  }

  /**
   * Get delay for next request
   */
  getNextDelay(): number {
    if (this.canMakeRequest()) {
      return this.options.delayMs;
    }

    const oldestRequest = Math.min(...this.requests);
    const waitTime = this.options.windowMs - (Date.now() - oldestRequest);
    
    return Math.max(waitTime, this.options.delayMs);
  }

  /**
   * Get current request count in window
   */
  getCurrentCount(): number {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);
    return this.requests.length;
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.requests = [];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create a rate limiter for vedabase.io
 * Respectful rate limiting: max 1 request per second
 */
export function createVedabaseRateLimiter(): RateLimiter {
  return new RateLimiter({
    maxRequests: 1,
    windowMs: 1000, // 1 second
    delayMs: 1000,  // 1 second delay between requests
  });
}

/**
 * Create a rate limiter for general web scraping
 */
export function createWebScrapingRateLimiter(): RateLimiter {
  return new RateLimiter({
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    delayMs: 2000,   // 2 seconds delay between requests
  });
}
