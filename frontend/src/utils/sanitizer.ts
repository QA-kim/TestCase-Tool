/**
 * XSS protection utilities for frontend
 */

/**
 * Escape HTML special characters to prevent XSS attacks
 */
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
  }

  return text.replace(/[&<>"'/]/g, (char) => map[char])
}

/**
 * Remove HTML tags from text
 */
export function stripHtml(html: string): string {
  const tmp = document.createElement('DIV')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

/**
 * Sanitize user input by removing dangerous characters
 */
export function sanitizeInput(input: string): string {
  if (!input) return input

  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '')

  return sanitized
}

/**
 * Validate and sanitize text input with length limit
 */
export function validateTextInput(input: string, maxLength: number): { valid: boolean; sanitized: string; error?: string } {
  if (!input || input.trim().length === 0) {
    return { valid: false, sanitized: '', error: '입력값이 비어있습니다' }
  }

  const trimmed = input.trim()

  if (trimmed.length > maxLength) {
    return { valid: false, sanitized: trimmed, error: `입력값은 ${maxLength}자를 초과할 수 없습니다` }
  }

  const sanitized = sanitizeInput(trimmed)

  return { valid: true, sanitized }
}
