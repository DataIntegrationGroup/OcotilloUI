import { IPdfDensity } from './IPdfDensity'

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

  density?: IPdfDensity
}

export const optionalFields: (keyof IPdfOptions)[] = [
  'includeHoleDepth',
  'includeConstructionNotes',
  'includeCasingDiameter',
  'includeFormationCompletionCode',
  'includeIsOpenAndSuitableForDataLogger',
  'includeAquiferSystems',
  'includeAquiferTypes',
  'includeHydrograph',
  'includeBlankPage',
  'includeAssets',
]
