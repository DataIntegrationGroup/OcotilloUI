import { describe, it, expect } from 'vitest'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import {
  zLexiconTermResponse,
  zLexiconCategoryResponse,
  zCreateLexiconTerm,
  zCreateLexiconCategory,
  zUpdateLexiconTerm,
  zUpdateLexiconCategory
} from '@/generated/zod.gen'
import {
  LexiconTermResponse,
  LexiconCategoryResponse,
  CreateLexiconTerm,
  CreateLexiconCategory,
  UpdateLexiconTerm,
  UpdateLexiconCategory,
} from '@/generated/types.gen'

describe('Ocotillo Integration Tests: Lexicon', () => {

  it('should fetch terms using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'lexicon/term',
      pagination: { currentPage: 1, pageSize: 10 }
    })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)

    if (result.data.length > 0) {
      const term = result.data[0] as LexiconTermResponse

      // Validate against schema
      try {
        const validatedTerm = zLexiconTermResponse.parse(term)
        expect(validatedTerm).toBeDefined()
      } catch (error) {
        console.error('Schema validation failed:', getErrorMessage(error))
        console.error('Term data:', JSON.stringify(term, null, 2))
        throw new Error(`API response doesn't match ITerm interface: ${getErrorMessage(error)}`)
      }
    }
  })

  it('should fetch single term by ID using data provider', async () => {
    const result = await ocotilloDataProvider.getOne({
      resource: 'lexicon/term',
      id: 1,
      meta: {}
    })

    expect(result).toHaveProperty('data')

    const term = result.data as LexiconTermResponse

    // Validate against schema
    try {
      const validatedTerm = zLexiconTermResponse.parse(term)
      expect(validatedTerm).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', getErrorMessage(error))
      console.error('Term data:', JSON.stringify(term, null, 2))
      throw new Error(`API response doesn't match ITerm interface: ${getErrorMessage(error)}`)
    }
  })

  it('should create term using data provider', async () => {
    const testData: CreateLexiconTerm = zCreateLexiconTerm.parse({
      term: 'Test Term',
      definition: 'This is a test term definition',
      categories: ['Test Category'] 
    })

    const result = await ocotilloDataProvider.create({
      resource: 'lexicon/term',
      variables: testData
    })

    expect(result).toHaveProperty('data')

    const createdTerm = result.data as LexiconTermResponse

    // Validate against schema
    try {
      const validatedTerm = zLexiconTermResponse.parse(createdTerm)
      expect(validatedTerm).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', getErrorMessage(error))
      console.error('Term data:', JSON.stringify(createdTerm, null, 2))
      throw new Error(`API response doesn't match ITerm interface: ${getErrorMessage(error)}`)
    }
  })

  it('should update term using data provider', async () => {
    const testData: UpdateLexiconTerm = zUpdateLexiconTerm.parse({
      term: 'Updated Test Term',
      definition: 'This is an updated test term definition'
    })

    const result = await ocotilloDataProvider.update({
      resource: 'lexicon/term',
      id: 1,
      variables: testData
    })

    expect(result).toHaveProperty('data')

    const updatedTerm = result.data as LexiconTermResponse

    // Validate against schema
    try {
      const validatedTerm = zLexiconTermResponse.parse(updatedTerm)
      expect(validatedTerm).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', getErrorMessage(error))
      console.error('Term data:', JSON.stringify(updatedTerm, null, 2))
      throw new Error(`API response doesn't match ITerm interface: ${getErrorMessage(error)}`)
    }
  })

  it('should fetch categories using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'lexicon/category',
      pagination: { currentPage: 1, pageSize: 10 }
    })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)

    if (result.data.length > 0) {
      const category = result.data[0] as LexiconCategoryResponse

      // Validate against schema
      try {
        const validatedCategory = zLexiconCategoryResponse.parse(category)
        expect(validatedCategory).toBeDefined()
      } catch (error) {
        console.error('Schema validation failed:', getErrorMessage(error))
        console.error('Category data:', JSON.stringify(category, null, 2))
        throw new Error(`API response doesn't match ICategory interface: ${getErrorMessage(error)}`)
      }
    }
  })

  it('should fetch single category by ID using data provider', async () => {
    const result = await ocotilloDataProvider.getOne({
      resource: 'lexicon/category',
      id: 1,
      meta: {}
    })

    expect(result).toHaveProperty('data')

    const category = result.data as LexiconCategoryResponse

    // Validate against schema
    try {
      const validatedCategory = zLexiconCategoryResponse.parse(category)
      expect(validatedCategory).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', getErrorMessage(error))
      console.error('Category data:', JSON.stringify(category, null, 2))
      throw new Error(`API response doesn't match ICategory interface: ${getErrorMessage(error)}`)
    }
  })

  it('should create category using data provider', async () => {
    const testData: CreateLexiconCategory = zCreateLexiconCategory.parse({
      name: 'Test Category'
    })

    const result = await ocotilloDataProvider.create({
      resource: 'lexicon/category',
      variables: testData
    })

    expect(result).toHaveProperty('data')

    const createdCategory = result.data as LexiconCategoryResponse

    // Validate against schema
    try {
      const validatedCategory = zLexiconCategoryResponse.parse(createdCategory)
      expect(validatedCategory).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', getErrorMessage(error))
      console.error('Category data:', JSON.stringify(createdCategory, null, 2))
      throw new Error(`API response doesn't match ICategory interface: ${getErrorMessage(error)}`)
    }
  })

  it('should update category using data provider', async () => {
    const testData: UpdateLexiconCategory = zUpdateLexiconCategory.parse({
      name: 'Updated Test Category'
    })

    const result = await ocotilloDataProvider.update({
      resource: 'lexicon/category',
      id: 1,
      variables: testData
    })

    expect(result).toHaveProperty('data')

    const updatedCategory = result.data as LexiconCategoryResponse

    // Validate against schema
    try {
      const validatedCategory = zLexiconCategoryResponse.parse(updatedCategory)
      expect(validatedCategory).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', getErrorMessage(error))
      console.error('Category data:', JSON.stringify(updatedCategory, null, 2))
      throw new Error(`API response doesn't match ICategory interface: ${getErrorMessage(error)}`)
    }
  })
})
