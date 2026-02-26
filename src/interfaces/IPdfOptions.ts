export type PdfDensity = 'normal' | 'dense' | 'very-dense'

export interface IPdfOptions {
  includeHoleDepth?: boolean | null
  includeAquiferSystems?: boolean | null
  includeFormationCompletionCode?: boolean | null
  includeIsOpenAndSuitableForDataLogger?: boolean | null
  includeAquiferTypes?: boolean | null
  includeCasingDiameter?: boolean | null
  includeHydrograph?: boolean | null
  includeConstructionNotes?: boolean | null
  includeBlankPage?: boolean | null
  includeAssets?: boolean | null

  density?: PdfDensity
}

export const optionalFields: (keyof IPdfOptions)[] = [
  'includeHoleDepth',
  'includeAquiferSystems',
  'includeFormationCompletionCode',
  'includeIsOpenAndSuitableForDataLogger',
  'includeAquiferTypes',
  'includeCasingDiameter',
  'includeHydrograph',
  'includeConstructionNotes',
  'includeBlankPage',
  'includeAssets',
]
