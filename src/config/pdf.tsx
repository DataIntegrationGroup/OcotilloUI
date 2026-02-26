import { IPdfOptions } from '@/interfaces'

export const PDF_DEFAULT_VALUES: IPdfOptions = {
  includeHoleDepth: true,
  includeAquiferSystems: true,
  includeFormationCompletionCode: true,
  includeIsOpenAndSuitableForDataLogger: true,
  includeAquiferTypes: true,
  includeCasingDiameter: true,
  includeHydrograph: true,
  includeConstructionNotes: true,
  includeBlankPage: false,
  includeAssets: true,

  density: 'normal',
}

export const PDF_SINGLE_PAGE_OPTION: IPdfOptions = {
  includeHoleDepth: false,
  includeAquiferSystems: false,
  includeFormationCompletionCode: false,
  includeIsOpenAndSuitableForDataLogger: false,
  includeAquiferTypes: false,
  includeCasingDiameter: false,
  includeHydrograph: false,
  includeConstructionNotes: false,
  includeBlankPage: false,
  includeAssets: false,
  density: 'very-dense',
}
