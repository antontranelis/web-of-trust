import { useLanguage } from '../../i18n'

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  steps: { label: string; description: string }[]
}

export function ProgressIndicator({ currentStep, totalSteps, steps }: ProgressIndicatorProps) {
  const { t, fmt } = useLanguage()

  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">
          {fmt(t.progress.stepOfTotal, { currentStep, totalSteps })}
        </span>
        <span className="text-sm text-slate-500">{steps[currentStep - 1]?.label}</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Step Dots */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNum = index + 1
          const isCompleted = stepNum < currentStep
          const isCurrent = stepNum === currentStep
          const isUpcoming = stepNum > currentStep

          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-slate-200 text-slate-400'
                }`}
              >
                {isCompleted ? '✓' : stepNum}
              </div>
              <span
                className={`text-xs mt-2 text-center ${
                  isCurrent ? 'text-slate-900 font-medium' : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
