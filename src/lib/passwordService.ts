import { supabase, supabaseAdmin } from './supabase';
import { UserProfile } from '../types';

export interface PasswordUpdateResult {
  success: boolean;
  error?: string;
  message?: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export class PasswordService {
  static validatePassword(password: string, confirmPassword?: string): PasswordValidationResult {
    const errors: string[] = [];

    if (!password || password.trim().length === 0) {
      errors.push('Password is required');
    } else {
      if (password.length < 6) {
        errors.push('Password must be at least 6 characters long');
      }

      if (password.length > 128) {
        errors.push('Password must be less than 128 characters long');
      }

      // Check for at least one uppercase letter
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }

      // Check for at least one lowercase letter
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }

      // Check for at least one number
      if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
      }
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      errors.push('Passwords do not match');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Updates the current user's password
   */
  static async updateCurrentUserPassword(newPassword: string): Promise<PasswordUpdateResult> {
    try {
      const validation = this.validatePassword(newPassword);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        // Handle specific error types
        if (error.message.includes('session_not_found') || error.message.includes('User not found')) {
          return {
            success: false,
            error: 'Your session has expired. Please log in again to update your password.'
          };
        }

        return {
          success: false,
          error: `Password update failed: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'Password updated successfully'
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred'
      };
    }
  }

  /**
   * Updates another user's password (requires HOD role and service role key)
   */
  static async updateUserPassword(
    userId: string,
    newPassword: string,
    currentUserRole?: string
  ): Promise<PasswordUpdateResult> {
    try {
      // Check if current user has HOD role
      if (currentUserRole !== 'HOD') {
        return {
          success: false,
          error: 'Only HOD can update other users\' passwords'
        };
      }

      const validation = this.validatePassword(newPassword);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Check if service role client is configured
      if (!supabaseAdmin) {
        return {
          success: false,
          error: 'Service role key is not configured. Please contact administrator.'
        };
      }

      // Update password using admin client
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) {
        return {
          success: false,
          error: `Failed to update password: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'Password updated successfully'
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred'
      };
    }
  }

  /**
   * Updates user password during profile creation/update
   */
  static async updateUserPasswordInProfile(
    userId: string,
    newPassword: string,
    currentUserRole?: string
  ): Promise<PasswordUpdateResult> {
    return this.updateUserPassword(userId, newPassword, currentUserRole);
  }

  /**
   * Resets user password by sending reset email
   */
  static async resetUserPassword(email: string): Promise<PasswordUpdateResult> {
    try {
      if (!email || !email.trim()) {
        return {
          success: false,
          error: 'Email is required'
        };
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          error: 'Please enter a valid email address'
        };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`
      });

      if (error) {
        return {
          success: false,
          error: `Failed to send reset email: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'Password reset email sent successfully. Please check your email.'
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred'
      };
    }
  }

  /**
   * Validates email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Checks if user session is valid
   */
  static async isSessionValid(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch {
      return false;
    }
  }
}
