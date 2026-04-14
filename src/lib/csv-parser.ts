import Papa from 'papaparse'
import type { DataField, DataRow, DataSource, FieldType } from '@/types'

/** 生成唯一ID */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** 检测字段类型 */
function detectFieldType(values: string[]): FieldType {
  const nonEmpty = values.filter(v => v != null && v.toString().trim() !== '')
  if (nonEmpty.length === 0) return 'string'

  // 检查是否为日期
  const datePatterns = [
    /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/,
    /^\d{4}[-/]\d{1,2}$/,
    /^\d{4}年\d{1,2}月/,
    /^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/,
  ]
  const dateCount = nonEmpty.filter(v =>
    datePatterns.some(p => p.test(v.toString().trim()))
  ).length
  if (dateCount / nonEmpty.length > 0.7) return 'date'

  // 检查是否为数值
  const numCount = nonEmpty.filter(v => {
    const cleaned = v.toString().replace(/,/g, '').trim()
    return !isNaN(Number(cleaned)) && cleaned !== ''
  }).length
  if (numCount / nonEmpty.length > 0.7) return 'number'

  return 'string'
}

/** 解析CSV文件 */
export function parseCSVFile(file: File): Promise<DataSource> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete(results) {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error(`CSV解析失败: ${results.errors[0].message}`))
          return
        }

        const headers = results.meta.fields || []
        if (headers.length === 0) {
          reject(new Error('CSV文件没有检测到有效的列名'))
          return
        }

        const rawRows = results.data as Record<string, string>[]

        // 检测每列类型
        const fields: DataField[] = headers.map(name => {
          const columnValues = rawRows.slice(0, 100).map(row => row[name] || '')
          const type = detectFieldType(columnValues)
          return {
            name,
            type,
            role: type === 'number' ? 'metric' : 'dimension',
            aggregation: type === 'number' ? 'sum' : undefined,
            sampleValues: columnValues.slice(0, 5),
          }
        })

        // 转换数据
        const rows: DataRow[] = rawRows.map(raw => {
          const row: DataRow = {}
          fields.forEach(field => {
            const rawValue = raw[field.name]
            if (field.type === 'number') {
              const cleaned = (rawValue || '').toString().replace(/,/g, '').trim()
              row[field.name] = cleaned === '' ? null : Number(cleaned)
            } else {
              row[field.name] = rawValue || null
            }
          })
          return row
        })

        const dataSource: DataSource = {
          id: generateId(),
          name: file.name.replace(/\.[^.]+$/, ''),
          fields,
          rows,
          rowCount: rows.length,
          createdAt: Date.now(),
        }

        resolve(dataSource)
      },
      error(err) {
        reject(new Error(`CSV解析错误: ${err.message}`))
      },
    })
  })
}

/** 解析CSV字符串（用于演示数据） */
export function parseCSVString(csvString: string, name: string): DataSource {
  const results = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
  })

  const headers = results.meta.fields || []
  const rawRows = results.data as Record<string, string>[]

  const fields: DataField[] = headers.map(fieldName => {
    const columnValues = rawRows.slice(0, 100).map(row => row[fieldName] || '')
    const type = detectFieldType(columnValues)
    return {
      name: fieldName,
      type,
      role: type === 'number' ? 'metric' : 'dimension',
      aggregation: type === 'number' ? 'sum' : undefined,
      sampleValues: columnValues.slice(0, 5),
    }
  })

  const rows: DataRow[] = rawRows.map(raw => {
    const row: DataRow = {}
    fields.forEach(field => {
      const rawValue = raw[field.name]
      if (field.type === 'number') {
        const cleaned = (rawValue || '').toString().replace(/,/g, '').trim()
        row[field.name] = cleaned === '' ? null : Number(cleaned)
      } else {
        row[field.name] = rawValue || null
      }
    })
    return row
  })

  return {
    id: generateId(),
    name,
    fields,
    rows,
    rowCount: rows.length,
    createdAt: Date.now(),
  }
}