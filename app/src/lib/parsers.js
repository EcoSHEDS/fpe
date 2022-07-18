import Papa from 'papaparse'

export const parseFile = (file) => new Promise((resolve, reject) => {
  return Papa.parse(file, {
    header: true,
    comments: '#',
    delimiter: ',',
    download: false,
    skipEmptyLines: 'greedy',
    complete: (results) => resolve(results),
    error: (e) => reject(e)
  })
})
