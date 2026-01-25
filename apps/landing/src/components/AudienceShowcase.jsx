import { useAudience } from '../audience'
import { useLanguage } from '../i18n/LanguageContext'

/**
 * Showcase component that displays audience-specific values and use cases
 * Only visible when a non-default audience is selected
 */
export default function AudienceShowcase() {
  const { audience, getContent, currentAudience, isEnabled } = useAudience()
  const { language } = useLanguage()

  // Only show when enabled via URL param AND a specific audience is selected
  if (!isEnabled || audience === 'default') return null

  const values = getContent('values')
  const useCases = getContent('useCases')
  const problemSolution = getContent('problemSolution')
  const philosophy = getContent('philosophy')

  return (
    <section className="py-20 bg-gradient-to-b from-primary/5 to-background" id="audience-showcase">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <span className="text-xl">{currentAudience.icon}</span>
            <span>Perspektive: {currentAudience.label}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {philosophy?.headline}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {philosophy?.description}
          </p>
        </div>

        {/* Problem / Solution */}
        {problemSolution && (
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="p-8 rounded-2xl bg-destructive/5 border border-destructive/10">
              <h3 className="text-xl font-semibold text-destructive mb-4">
                {problemSolution.problemTitle}
              </h3>
              <p className="text-muted-foreground">
                {problemSolution.problemText}
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-primary/5 border border-primary/10">
              <h3 className="text-xl font-semibold text-primary mb-4">
                {problemSolution.solutionTitle}
              </h3>
              <p className="text-muted-foreground">
                {problemSolution.solutionText}
              </p>
            </div>
          </div>
        )}

        {/* Values */}
        {values && values.length > 0 && (
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-foreground text-center mb-8">
              {language === 'de' ? 'Was uns wichtig ist' : 'What matters to us'}
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="p-6 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors"
                >
                  <h4 className="text-lg font-semibold text-foreground mb-2">
                    {value.title}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Use Cases */}
        {useCases && useCases.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-foreground text-center mb-8">
              {language === 'de' ? 'Anwendungsfälle' : 'Use Cases'}
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {useCases.map((useCase, index) => (
                <div
                  key={index}
                  className="p-6 rounded-xl bg-secondary/5 border border-secondary/10 hover:border-secondary/30 transition-colors"
                >
                  <h4 className="text-lg font-semibold text-foreground mb-2">
                    {useCase.title}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {useCase.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
