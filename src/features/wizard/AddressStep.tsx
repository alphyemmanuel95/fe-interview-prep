import { FieldError } from './FieldError'
import { getInputClass } from './styles'
import { TextField } from './TextField'
import { COUNTRIES, getErrorId, getFieldId } from './types'
import type { StepFieldsProps } from './types'

export function AddressStep({ data, errors, onChange }: StepFieldsProps) {
  const countryId = getFieldId('country')
  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor={countryId}
          className="block text-sm font-medium text-slate-700"
        >
          Country
        </label>
        <select
          id={countryId}
          value={data.country}
          onChange={(event) => {
            onChange({ country: event.target.value })
          }}
          autoComplete="country-name"
          aria-invalid={errors.country !== undefined}
          aria-describedby={
            errors.country === undefined ? undefined : getErrorId('country')
          }
          className={`mt-1.5 ${getInputClass(errors.country)}`}
        >
          <option value="">Select a country</option>
          {COUNTRIES.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
        <FieldError field="country" message={errors.country} />
      </div>
      <TextField
        field="city"
        label="City"
        value={data.city}
        error={errors.city}
        onChange={(city) => {
          onChange({ city })
        }}
        autoComplete="address-level2"
      />
      <TextField
        field="postalCode"
        label="Postal code"
        value={data.postalCode}
        error={errors.postalCode}
        onChange={(postalCode) => {
          onChange({ postalCode })
        }}
        autoComplete="postal-code"
      />
    </div>
  )
}
