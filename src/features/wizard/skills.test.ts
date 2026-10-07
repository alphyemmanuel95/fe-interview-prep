import { describe, expect, it } from 'vitest'
import { addSkill, removeSkill } from './skills'

describe('addSkill', () => {
  it('appends a trimmed skill', () => {
    expect(addSkill(['React'], '  TypeScript ')).toEqual([
      'React',
      'TypeScript',
    ])
  })

  it('ignores blank input', () => {
    const skills = ['React']
    expect(addSkill(skills, '   ')).toBe(skills)
  })

  it('ignores duplicates regardless of case', () => {
    const skills = ['React']
    expect(addSkill(skills, ' react ')).toBe(skills)
  })
})

describe('removeSkill', () => {
  it('removes only the given skill', () => {
    expect(removeSkill(['React', 'CSS', 'Go'], 'CSS')).toEqual(['React', 'Go'])
  })
})
