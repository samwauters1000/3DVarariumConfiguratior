export function getConfirmationIssues(configuration) {
  const issues = []
  if (configuration.terrarium === null) issues.push('Choose a terrarium')
  if (configuration.ground === null) issues.push('Choose a ground')
  if (configuration.plants.length === 0) issues.push('Add at least one plant')
  return issues
}

export const canChooseGround = (configuration) => configuration.terrarium !== null
