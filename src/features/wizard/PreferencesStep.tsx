import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Icon } from '../../components/Icon'
import { FieldError } from './FieldError'
import { addSkill, removeSkill } from './skills'
import { getInputClass, SECONDARY_BUTTON_CLASS } from './styles'
import { getErrorId, getFieldId, getPlanOptionId, PLANS } from './types'
import type { Plan, StepFieldsProps } from './types'

const PLAN_DETAILS: Record<Plan, { price: string; description: string }> = {
  Free: { price: '$0/mo', description: 'The basics, for trying things out.' },
  Pro: { price: '$12/mo', description: 'Everything you need on your own.' },
  Team: { price: '$29/mo', description: 'Shared workspaces for your team.' },
}

const SKILLS_HINT_ID = 'wizard-skills-hint'
const SKILLS_NOTICE_ID = 'wizard-skills-notice'

export function PreferencesStep({ data, errors, onChange }: StepFieldsProps) {
  const [skillDraft, setSkillDraft] = useState('')
  // Inline feedback when a skill is not added (e.g. a duplicate).
  const [skillNotice, setSkillNotice] = useState('')
  // Polite screen-reader feedback for successful adds and removals.
  const [announcement, setAnnouncement] = useState('')
  const skillInputRef = useRef<HTMLInputElement>(null)
  const skillsId = getFieldId('skills')
  const planErrorId = errors.plan === undefined ? undefined : getErrorId('plan')
  const skillsDescribedBy = [
    SKILLS_HINT_ID,
    skillNotice === '' ? undefined : SKILLS_NOTICE_ID,
    errors.skills === undefined ? undefined : getErrorId('skills'),
  ]
    .filter((id) => id !== undefined)
    .join(' ')

  function handleAddSkill() {
    const skill = skillDraft.trim()
    if (skill === '') {
      return
    }
    const nextSkills = addSkill(data.skills, skill)
    if (nextSkills === data.skills) {
      // Keep the draft so the user can see and correct what they typed.
      setSkillNotice(`${skill} is already added.`)
      // Focus stays put, so a description change alone is not announced.
      setAnnouncement(`${skill} is already added.`)
      return
    }
    onChange({ skills: nextSkills })
    setSkillDraft('')
    setSkillNotice('')
    setAnnouncement(`Added ${skill}`)
  }

  function handleSkillKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Enter adds the skill; it must not submit the step.
    if (event.key === 'Enter') {
      event.preventDefault()
      handleAddSkill()
    }
  }

  function handleRemoveSkill(skill: string) {
    onChange({ skills: removeSkill(data.skills, skill) })
    setAnnouncement(`Removed ${skill}`)
    // The remove button disappears with its chip; keep focus in the field.
    skillInputRef.current?.focus()
  }

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Plan</legend>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const details = PLAN_DETAILS[plan]
            return (
              <label
                key={plan}
                htmlFor={getPlanOptionId(plan)}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-300 p-3 transition hover:border-indigo-400 has-checked:border-indigo-600 has-checked:bg-indigo-50 has-checked:ring-1 has-checked:ring-indigo-600 sm:flex-col sm:gap-2"
              >
                <input
                  id={getPlanOptionId(plan)}
                  type="radio"
                  name="plan"
                  value={plan}
                  checked={data.plan === plan}
                  onChange={() => {
                    onChange({ plan })
                  }}
                  aria-invalid={errors.plan !== undefined}
                  aria-describedby={planErrorId}
                  className="mt-0.5 size-4 shrink-0 accent-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                />
                <span>
                  <span className="block font-semibold text-slate-900">
                    {plan}
                    <span className="ml-1.5 text-sm font-medium text-slate-500">
                      {details.price}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-600">
                    {details.description}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
        <FieldError field="plan" message={errors.plan} />
      </fieldset>

      <div>
        <label
          htmlFor={skillsId}
          className="block text-sm font-medium text-slate-700"
        >
          Skills
        </label>
        <p id={SKILLS_HINT_ID} className="mt-0.5 text-sm text-slate-500">
          Add at least one. Press Enter or select Add.
        </p>
        <div className="mt-1.5 flex gap-2">
          <input
            ref={skillInputRef}
            id={skillsId}
            value={skillDraft}
            onChange={(event) => {
              setSkillDraft(event.target.value)
              setSkillNotice('')
            }}
            onKeyDown={handleSkillKeyDown}
            placeholder="e.g. React"
            autoComplete="off"
            aria-invalid={errors.skills !== undefined}
            aria-describedby={skillsDescribedBy}
            className={`min-w-0 flex-1 ${getInputClass(errors.skills)}`}
          />
          <button
            type="button"
            onClick={handleAddSkill}
            className={SECONDARY_BUTTON_CLASS}
          >
            <Icon name="plus" className="size-5" />
            Add
          </button>
        </div>
        {skillNotice !== '' && (
          <p id={SKILLS_NOTICE_ID} className="mt-1.5 text-sm text-amber-800">
            {skillNotice}
          </p>
        )}
        <FieldError field="skills" message={errors.skills} />
        <p role="status" className="sr-only">
          {announcement}
        </p>

        {data.skills.length > 0 && (
          <ul aria-label="Added skills" className="mt-3 flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <li
                key={skill}
                className="flex max-w-full items-center gap-1 rounded-full bg-indigo-50 py-1 pr-1 pl-3 text-sm font-medium text-indigo-800 ring-1 ring-indigo-200"
              >
                <span className="break-all">{skill}</span>
                <button
                  type="button"
                  onClick={() => {
                    handleRemoveSkill(skill)
                  }}
                  aria-label={`Remove ${skill}`}
                  className="-my-1 rounded-full p-2 text-indigo-600 transition hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600"
                >
                  <Icon name="x" className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
