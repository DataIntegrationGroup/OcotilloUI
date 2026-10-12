import { describe, expect, it } from 'vitest'
import {
  buildSignupMailtoUrl,
  isNmtWorkEmail,
} from '@/pages/signup'

describe('signup request', () => {
  it('accepts only NMT work email addresses', () => {
    expect(isNmtWorkEmail('employee@nmt.edu')).toBe(true)
    expect(isNmtWorkEmail('EMPLOYEE@NMT.EDU')).toBe(true)
    expect(isNmtWorkEmail('employee@gmail.com')).toBe(false)
    expect(isNmtWorkEmail('employee@nmt.edu.example.com')).toBe(false)
  })

  it('builds a prefilled request email', () => {
    expect(buildSignupMailtoUrl('Ada Lovelace', 'ada@nmt.edu')).toBe(
      'mailto:nmbg-ocotillo@nmt.edu?subject=Ocotillo%20account%20request&body=Name%3A%20Ada%20Lovelace%0AWork%20email%3A%20ada%40nmt.edu'
    )
  })
})
