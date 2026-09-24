import type { TransducerObservationWithBlockResponse } from '@/generated/types.gen'
import type { IObservation } from '@/interfaces/ocotillo'

/**
 * The Ocotillo `Parameter` the transducer block routes are scoped to.
 *
 * `parameter_id` on a published block is a `Parameter` row id, not a lexicon
 * term id, and the API rejects any id other than this parameter's. There is no
 * parameter list endpoint, so the id is read off observations that carry it.
 */
export const GROUNDWATER_LEVEL_PARAMETER_NAME = 'groundwater level'

type ParameterSources = {
  transducerRows?: Pick<TransducerObservationWithBlockResponse, 'block'>[]
  manualRows?: Pick<IObservation, 'parameter'>[]
}

export const findGroundwaterLevelParameterId = ({
  transducerRows = [],
  manualRows = [],
}: ParameterSources): number | null => {
  // The transducer read route only returns blocks under this parameter.
  const blockParameterId = transducerRows.find(
    (row) => typeof row.block?.parameter_id === 'number'
  )?.block.parameter_id
  if (typeof blockParameterId === 'number') return blockParameterId

  const manualParameter = manualRows.find(
    (row) => row.parameter?.parameter_name === GROUNDWATER_LEVEL_PARAMETER_NAME
  )?.parameter
  return manualParameter?.id ?? null
}
