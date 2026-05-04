import { describe, expect, it } from 'vitest'
import { parseUserIdsFromCsv } from './csv'

describe('parseUserIdsFromCsv', () => {
  it('drops the header row when first column is "id"', () => {
    expect(parseUserIdsFromCsv('id\nu_1\nu_2')).toEqual(['u_1', 'u_2'])
  })

  it('treats first row as data when no header is present', () => {
    expect(parseUserIdsFromCsv('u_1\nu_2\nu_3')).toEqual(['u_1', 'u_2', 'u_3'])
  })

  it.each([
    ['id\nu_1', ['u_1']],
    ['user_id\nu_1', ['u_1']],
    ['userId\nu_1', ['u_1']],
    ['User_ID\nu_1', ['u_1']], // case-insensitive
    ['USERID\nu_1', ['u_1']],
  ])('drops header variant %s', (csv, expected) => {
    expect(parseUserIdsFromCsv(csv)).toEqual(expected)
  })

  it('preserves commas inside quoted values', () => {
    expect(parseUserIdsFromCsv('id\n"u,1"\nu_2')).toEqual(['u,1', 'u_2'])
  })

  it('strips a leading BOM', () => {
    // U+FEFF is invisible in source — use the explicit Unicode escape so the
    // test stays readable and survives autoformatters.
    expect(parseUserIdsFromCsv('﻿id\nu_1')).toEqual(['u_1'])
  })

  it('skips trailing newline and empty rows', () => {
    expect(parseUserIdsFromCsv('id\nu_1\n\nu_2\n')).toEqual(['u_1', 'u_2'])
  })

  it('handles CRLF line endings', () => {
    expect(parseUserIdsFromCsv('id\r\nu_1\r\nu_2\r\n')).toEqual(['u_1', 'u_2'])
  })

  it('decodes doubled quotes inside quoted values', () => {
    expect(parseUserIdsFromCsv('id\n"u""1"')).toEqual(['u"1'])
  })

  it('deduplicates while preserving first-seen order', () => {
    expect(parseUserIdsFromCsv('id\nu_1\nu_1\nu_2\nu_1')).toEqual(['u_1', 'u_2'])
  })

  it('takes only the first column for multi-column CSV', () => {
    expect(parseUserIdsFromCsv('id,email\nu_1,a@b.com\nu_2,c@d.com')).toEqual(['u_1', 'u_2'])
  })

  it('returns an empty array for empty input', () => {
    expect(parseUserIdsFromCsv('')).toEqual([])
  })

  it('trims whitespace from values', () => {
    expect(parseUserIdsFromCsv('id\n  u_1  \nu_2')).toEqual(['u_1', 'u_2'])
  })

  it('returns an empty array when only a header row is present', () => {
    expect(parseUserIdsFromCsv('id\n')).toEqual([])
  })
})
