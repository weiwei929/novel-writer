/**
 * Unified API Response Utility
 * 
 * Provides consistent response formatting across all API endpoints
 */

export class ApiResponse {
  /**
   * Success response
   * @param data - Response data
   * @param message - Optional success message
   */
  static success<T>(data: T, message?: string) {
    return {
      success: true,
      data,
      ...(message && { message })
    }
  }

  /**
   * Error response
   * @param message - Error message
   * @param code - HTTP status code
   * @param details - Optional error details
   */
  static error(message: string, code = 500, details?: any) {
    return {
      success: false,
      error: {
        code,
        message,
        ...(details && { details })
      }
    }
  }
}
