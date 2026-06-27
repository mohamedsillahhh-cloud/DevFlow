import { describe, expect, it } from 'vitest'
import { cx } from '../lib/cn'

describe('cx', () => {
  it('joins multiple class names', () => {
    expect(cx('foo', 'bar', 'baz')).toBe('foo bar baz')
  })

  it('filters out false values', () => {
    expect(cx('foo', false, 'bar', null, 'baz', undefined)).toBe('foo bar baz')
  })

  it('returns empty string for all falsey', () => {
    expect(cx(false, null, undefined)).toBe('')
  })

  it('returns empty string for no args', () => {
    expect(cx()).toBe('')
  })

  it('handles single class', () => {
    expect(cx('only')).toBe('only')
  })

  it('handles empty string', () => {
    expect(cx('a', '', 'b')).toBe('a b')
  })
})
