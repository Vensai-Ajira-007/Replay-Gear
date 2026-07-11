import type { ValueTransformer } from 'typeorm'

// Postgres `numeric`/`decimal` columns come back from the pg driver as strings.
// This transformer parses them to JS numbers on read and passes numbers through
// on write, so prices/ratings behave as numbers throughout the app.
export const numericTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : parseFloat(value),
}
