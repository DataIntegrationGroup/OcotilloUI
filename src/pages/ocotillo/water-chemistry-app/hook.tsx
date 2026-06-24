import {
  BaseRecord,
  CreatedValuesType,
  HttpError,
  ImportErrorResult,
  ImportSuccessResult,
  useCreate,
  useCreateMany,
  UseCreateManyReturnType,
  UseCreateReturnType,
} from '@refinedev/core'
import { useEffect, useState } from 'react'
import {
  IObservationUploadSchema,
  ISampleUploadSchema,
} from '@/pages/ocotillo/water-chemistry-app/column-schema'
// import { IUploadSchema } from '@/pages/dataforge/water-chemistry-app/column-schema'

type EachResolve<TResolve, Response> = (
  result: TResolve,
  index: number
) => Response
type EachReject<TReject, Response> = (error: TReject, index: number) => Response
export const sequentialPromises = async <
  TResolve = unknown,
  TReject = unknown,
  TResolveResponse = unknown,
  TRejectResponse = unknown,
>(
  promises: (() => Promise<TResolve>)[],
  onEachResolve: EachResolve<TResolve, TResolveResponse>,
  onEachReject: EachReject<TReject, TRejectResponse>
): Promise<(TResolveResponse | TRejectResponse)[]> => {
  const results = []

  for (const [index, promise] of promises.entries()) {
    try {
      const result = await promise()

      results.push(onEachResolve(result, index))
    } catch (error) {
      results.push(onEachReject(error as TReject, index))
    }
  }
  return results
}
type ImportResult<TVariables, TData extends BaseRecord> = {
  succeeded: ImportSuccessResult<TVariables, TData>[]
  errored: ImportErrorResult<TVariables>[]
}

type SampleCreateValues = {
  thing_id: number
  sample_type: string
  field_sample_id: string
  release_status: string
  sampler_name: string
  qc_sample: string
  sensor_id: number
  sample_matrix: string
  sample_method: string
  sample_date: string
  row_idx?: number
}

type ObservationCreateValues = {
  field_sample_id: string
  sensor_id: number
  release_status: string
  observed_property: string
  units: string
  value: string
  observation_datetime: string
  row_idx?: number
}

type CreateMutationResult<TData extends BaseRecord = BaseRecord> = {
  response: { data: TData }
  values: (SampleCreateValues | ObservationCreateValues)[]
}

type UseImportWaterChemistrySamplesProps<
  TData extends BaseRecord = BaseRecord,
  TVariables = unknown,
> = {
  dataProviderName?: string
  onFinish?: (result: ImportResult<TVariables, TData>) => void
  onProgress?: (progress: {
    totalAmount: number
    processedAmount: number
  }) => void
  samples: ISampleUploadSchema[]
  observations: IObservationUploadSchema[]
  batchSize?: number
}

export const useImportWaterChemistrySamples = <
  TItem = unknown,
  TData extends BaseRecord = BaseRecord,
  TError extends HttpError = HttpError,
  TVariables = unknown,
>({
  dataProviderName = 'ocotillo',
  onFinish,
  onProgress,
  samples,
  observations,
  batchSize = Number.MAX_SAFE_INTEGER,
}: UseImportWaterChemistrySamplesProps<TData, TVariables>) => {
  const [processedAmount, setProcessedAmount] = useState<number>(0)
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)

  const createMany = useCreateMany<TData, TError, TVariables>()
  const create = useCreate<TData, TError, TVariables>()
  let mutationResult:
    | UseCreateReturnType<TData, TError, TVariables>
    | UseCreateManyReturnType<TData, TError, TVariables>

  if (batchSize === 1) {
    mutationResult = create
  } else {
    mutationResult = createMany
  }

  const handleCleanup = () => {
    setTotalAmount(0)
    setProcessedAmount(0)
    setIsLoading(false)
  }

  const handleFinish = (
    createdValues: CreatedValuesType<TVariables, TData>[]
  ) => {
    console.log('createdSamples', createdValues)

    const result = {
      succeeded: createdValues.filter(
        (item) => item.type === 'success'
      ) as unknown as ImportSuccessResult<TVariables, TData>[],

      errored: createdValues.filter(
        (item) => item.type === 'error'
      ) as unknown as ImportErrorResult<TVariables>[],
    }

    onFinish?.(result)
    setIsLoading(false)
  }

  useEffect(() => {
    onProgress?.({ totalAmount, processedAmount })
  }, [totalAmount, processedAmount])

  const handleChange = () => {
    handleCleanup()

    const loader = (resolve: any) => {
      setIsLoading(true)

      // const sampleGroups = Object.groupBy(rows, (row) => row['sampleId'])
      // const filteredSampleGroups = Object.entries(sampleGroups).filter(
      //   ([sampleId, values]) => {
      //     // filter out samples with no sampleId
      //     return sampleId !== 'undefined'
      //   }
      // )
      const items = [...samples, ...observations]

      const sampleFns = samples.map((sample: ISampleUploadSchema) => {
        const vs: SampleCreateValues = {
          thing_id: 1,
          sample_type: 'groundwater',
          field_sample_id: sample.sampleId,
          release_status: 'draft',
          sampler_name: 'test',
          qc_sample: 'no',
          sensor_id: 1,
          sample_matrix: 'water',
          sample_method: 'manual',
          sample_date: new Date(sample.sampleDate.trim()).toISOString(),
        }

        const fn = async () => {
          const response = await create.mutateAsync({
            values: vs as TVariables,
            resource: 'sample',
            dataProviderName: dataProviderName,
            successNotification: false,
            errorNotification: false,
          })

          vs['row_idx'] = sample.idx // add index to the values
          return { response, values: [vs] }
        }
        return fn
      })

      const observationFns = observations.map(
        (observation: IObservationUploadSchema) => {
          const vs: ObservationCreateValues = {
            field_sample_id: observation.sampleId,
            sensor_id: 1, // hardcoded for now
            release_status: 'draft',
            observed_property: observation.observedProperty,
            units: observation.resultUnits,
            value: observation.result,
            observation_datetime: new Date(
              observation.sampleDate.trim()
            ).toISOString(),
          }

          const fn = async () => {
            const response = await create.mutateAsync({
              values: vs as TVariables,
              resource: 'observation/water-chemistry',
              dataProviderName: dataProviderName,
              successNotification: false,
              errorNotification: false,
            })
            vs['row_idx'] = observation.idx // add index to the values
            return { response, values: [vs] }
          }
          return fn
        }
      )

      const allFns: (() => Promise<CreateMutationResult<TData>>)[] = [
        ...sampleFns,
        ...observationFns,
      ]
      setTotalAmount(allFns.length)
      const createdValues = sequentialPromises(
        allFns,
        ({ response, values }) => {
          setProcessedAmount((currentAmount) => {
            return currentAmount + 1
          })

          return {
            response: [response.data],
            type: 'success',
            request: values,
          } as ImportSuccessResult<TVariables, TData>
        },
        (error: HttpError, index) => {
          setProcessedAmount((currentAmount) => {
            return currentAmount + 1
          })
          // onError?.({ error, payload: rows[index] })
          return {
            response: [error],
            type: 'error',
            request: [items[index]],
          } as ImportErrorResult<TVariables>
        }
      )
      resolve(createdValues)
    }
    // return new Promise<CreatedValuesType<TVariables, TData>[]>(loader).then(
    return new Promise<CreatedValuesType<TVariables, TData>[]>(loader).then(
      (createdValues) => {
        handleFinish(createdValues)
        return createdValues
      }
    )
  }

  return {
    inputProps: {
      onClick: () => handleChange(),
    },
    mutationResult,
    isLoading,
    handleChange,
  }
}
