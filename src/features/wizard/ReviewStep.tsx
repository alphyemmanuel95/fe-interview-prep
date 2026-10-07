import { Icon } from '../../components/Icon'
import { SummarySection } from './SummarySection'
import type { StepId, WizardData } from './types'

type ReviewStepProps = {
  readonly data: WizardData
  readonly onEdit: (step: StepId) => void
  readonly isSubmitting: boolean
  readonly hasSubmitError: boolean
}

export function ReviewStep({
  data,
  onEdit,
  isSubmitting,
  hasSubmitError,
}: ReviewStepProps) {
  return (
    <div className="space-y-4">
      <SummarySection
        title="Personal info"
        rows={[
          { label: 'Name', value: data.name.trim() },
          { label: 'Email', value: data.email.trim() },
          { label: 'Phone', value: data.phone.trim() },
        ]}
        onEdit={() => {
          onEdit('personal')
        }}
        isEditDisabled={isSubmitting}
      />
      <SummarySection
        title="Address"
        rows={[
          { label: 'Country', value: data.country },
          { label: 'City', value: data.city.trim() },
          { label: 'Postal code', value: data.postalCode.trim() },
        ]}
        onEdit={() => {
          onEdit('address')
        }}
        isEditDisabled={isSubmitting}
      />
      <SummarySection
        title="Preferences"
        rows={[
          { label: 'Plan', value: data.plan },
          { label: 'Skills', value: data.skills.join(', ') },
        ]}
        onEdit={() => {
          onEdit('preferences')
        }}
        isEditDisabled={isSubmitting}
      />
      {hasSubmitError && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200"
        >
          <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
          We couldn’t submit your registration. Please try again.
        </p>
      )}
    </div>
  )
}
