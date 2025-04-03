export const cleanUpText = (text: string): string => {
  // Remove any unwanted characters
  const cleanedText = text.replace(/[^a-zA-Z0-9.\s]/g, '')
  // Remove extra spaces
  return cleanedText.replace(/\s+/g, ' ').trim()
}

export const cleanUpNumbersBetweenBrackets = (text: string): string => {
  // Remove any unwanted characters
  const cleanedText = text.replace(/[^a-zA-Z0-9\s]/g, '')
  // Remove extra spaces
  return cleanedText.replace(/\s+/g, ' ').trim()
}
