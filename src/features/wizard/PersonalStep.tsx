import { TextField } from './TextField'
import type { StepFieldsProps } from './types'

export function PersonalStep({ data, errors, onChange }: StepFieldsProps) {
  return (
    <div className="space-y-4">
      <TextField
        field="name"
        label="Full name"
        value={data.name}
        error={errors.name}
        onChange={(name) => {
          onChange({ name })
        }}
        autoComplete="name"
      />
      <TextField
        field="email"
        label="Email"
        type="email"
        value={data.email}
        error={errors.email}
        onChange={(email) => {
          onChange({ email })
        }}
        autoComplete="email"
      />
      <TextField
        field="phone"
        label="Phone"
        type="tel"
        value={data.phone}
        error={errors.phone}
        onChange={(phone) => {
          onChange({ phone })
        }}
        autoComplete="tel"
      />
    </div>
  )
}
