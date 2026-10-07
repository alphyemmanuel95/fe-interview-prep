/**
 * Appends a trimmed skill. Blank input and case-insensitive duplicates are
 * ignored and the same list is returned.
 */
export function addSkill(
  skills: readonly string[],
  draft: string,
): readonly string[] {
  const skill = draft.trim()
  const isDuplicate = skills.some(
    (existing) => existing.toLowerCase() === skill.toLowerCase(),
  )
  if (skill === '' || isDuplicate) {
    return skills
  }
  return [...skills, skill]
}

export function removeSkill(
  skills: readonly string[],
  skill: string,
): readonly string[] {
  return skills.filter((existing) => existing !== skill)
}
