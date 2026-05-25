import { describe, expect, it } from 'vitest'
import { isAllowedEmail } from '../lib/app-config'

describe('app-config', () => {
  describe('isAllowedEmail', () => {
    it('returns false for null', () => {
      expect(isAllowedEmail(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isAllowedEmail(undefined)).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isAllowedEmail('')).toBe(false)
    })
  })
})
