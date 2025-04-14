export const cleanUpTextForCSV = (text: string): string => {
  // Replace newlines and commas with spaces
  return text.replace(/[\n,]/g, ' ')
}
