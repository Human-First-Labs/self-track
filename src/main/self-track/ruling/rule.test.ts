import { DataProcessor } from '.'
import { DataWriter } from '../data-consolidation'

describe('Rule', () => {
  it('should be defined', async () => {
    try {
      console.log('starting')
      const data = await DataWriter.loadCSV('./test-big-csv.csv')

      console.log('data', data)

      const processedData = DataProcessor.processRawData(data)

      DataProcessor.generateFinalExcelReport({
        data: processedData,
        rawName: 'test-big-csv.csv',
        reportPath: '.'
      })
    } catch (e) {
      console.error(e)
    }
  }, 999999999)
})
