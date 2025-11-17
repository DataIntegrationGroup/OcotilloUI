export interface FieldConfig {
  label?: string
  formatter?: (value: any) => string | React.ReactNode
  hidden?: boolean
}

export type FieldConfigs<T> = Partial<Record<keyof T, FieldConfig>>
