import { supabase } from './supabase';

/**
 * Service to handle Supabase ping requests to keep the connection active
 */

export interface PingResult {
  success: boolean;
  timestamp: string;
  error?: string;
  responseTime?: number;
}

/**
 * Sends a ping request to Supabase to keep the connection active
 * This executes a simple query to prevent the connection from timing out
 */
export const sendSupabasePing = async (): Promise<PingResult> => {
  const startTime = Date.now();
  
  try {
    // Execute a simple query that's lightweight but ensures the connection is active
    const { error } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true })
      .limit(1);

    const responseTime = Date.now() - startTime;
    
    if (error) {
      console.warn('Supabase ping failed:', error.message);
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: error.message,
        responseTime
      };
    }

    console.log(`✅ Supabase ping successful. Response time: ${responseTime}ms`);
    return {
      success: true,
      timestamp: new Date().toISOString(),
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('Supabase ping error:', error);
    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: errorMessage,
      responseTime
    };
  }
};

/**
 * Calculates the next ping time based on the last ping timestamp
 * @param lastPingTime ISO string of last ping time
 * @param intervalMs Interval in milliseconds (default: 2 days)
 */
export const getNextPingTime = (lastPingTime: string | null, intervalMs: number = 2 * 24 * 60 * 60 * 1000): Date => {
  if (!lastPingTime) {
    return new Date(Date.now() + intervalMs);
  }
  
  const lastPing = new Date(lastPingTime);
  return new Date(lastPing.getTime() + intervalMs);
};

/**
 * Checks if it's time to send the next ping
 * @param lastPingTime ISO string of last ping time
 * @param intervalMs Interval in milliseconds (default: 2 days)
 */
export const shouldSendPing = (lastPingTime: string | null, intervalMs: number = 2 * 24 * 60 * 60 * 1000): boolean => {
  if (!lastPingTime) {
    return true;
  }
  
  const lastPing = new Date(lastPingTime);
  const now = new Date();
  return now.getTime() - lastPing.getTime() >= intervalMs;
};
