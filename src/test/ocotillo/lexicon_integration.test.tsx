import { describe, it, expect, beforeEach } from 'vitest'
import { TermSchema, CategorySchema } from '@/pages/ocotillo/lexicon/schema'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import { delay } from '@/test/delay'
import { ITerm, ICategory } from '@/interfaces/ocotillo/ILexicon'

describe('Ocotillo Integration Tests: Lexicon', () => {
  beforeEach(async () => {
    await delay(100)
  })

  it('should fetch terms using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'lexicon/term',
      pagination: { current: 1, pageSize: 10 }
    })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)

    if (result.data.length > 0) {
      const term = result.data[0] as ITerm

      // Validate against schema
      try {
        const validatedTerm = await TermSchema.validate(term, { strict: true })
        expect(validatedTerm).toBeDefined()
      } catch (error) {
        console.error('Schema validation failed:', error.message)
        console.error('Term data:', JSON.stringify(term, null, 2))
        throw new Error(`API response doesn't match ITerm interface: ${error.message}`)
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

    const term = result.data as ITerm

    // Validate against schema
    try {
      const validatedTerm = await TermSchema.validate(term, { strict: true })
      expect(validatedTerm).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Term data:', JSON.stringify(term, null, 2))
      throw new Error(`API response doesn't match ITerm interface: ${error.message}`)
    }
  })

  it('should create term using data provider', async () => {
    const result = await ocotilloDataProvider.create({
      resource: 'lexicon/term',
      variables: {
        term: 'Test Term',
        definition: 'This is a test term definition',
        categories: [{ id: 1, name: 'Test Category' }] 
      }
    })

    expect(result).toHaveProperty('data')

    const createdTerm = result.data as ITerm

    // Validate against schema
    try {
      const validatedTerm = await TermSchema.validate(createdTerm, { strict: true })
      expect(validatedTerm).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Term data:', JSON.stringify(createdTerm, null, 2))
      throw new Error(`API response doesn't match ITerm interface: ${error.message}`)
    }
  })

  it('should update term using data provider', async () => {
    const result = await ocotilloDataProvider.update({
      resource: 'lexicon/term',
      id: 1,
      variables: {
        term: 'Updated Test Term',
        definition: 'This is an updated test term definition',
        categories: [{ id: 1, name: 'Test Category 1' }, { id: 2, name: 'Test Category 2' }] 
      }
    })

    expect(result).toHaveProperty('data')

    const updatedTerm = result.data as ITerm

    // Validate against schema
    try {
      const validatedTerm = await TermSchema.validate(updatedTerm, { strict: true })
      expect(validatedTerm).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Term data:', JSON.stringify(updatedTerm, null, 2))
      throw new Error(`API response doesn't match ITerm interface: ${error.message}`)
    }
  })

  it('should fetch categories using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'lexicon/category',
      pagination: { current: 1, pageSize: 10 }
    })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)

    if (result.data.length > 0) {
      const category = result.data[0] as ICategory

      // Validate against schema
      try {
        const validatedCategory = await CategorySchema.validate(category, { strict: true })
        expect(validatedCategory).toBeDefined()
      } catch (error) {
        console.error('Schema validation failed:', error.message)
        console.error('Category data:', JSON.stringify(category, null, 2))
        throw new Error(`API response doesn't match ICategory interface: ${error.message}`)
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

    const category = result.data as ICategory

    // Validate against schema
    try {
      const validatedCategory = await CategorySchema.validate(category, { strict: true })
      expect(validatedCategory).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Category data:', JSON.stringify(category, null, 2))
      throw new Error(`API response doesn't match ICategory interface: ${error.message}`)
    }
  })

  it('should create category using data provider', async () => {
    const result = await ocotilloDataProvider.create({
      resource: 'lexicon/category',
      variables: {
        name: 'Test Category'
      }
    })

    expect(result).toHaveProperty('data')

    const createdCategory = result.data as ICategory

    // Validate against schema
    try {
      const validatedCategory = await CategorySchema.validate(createdCategory, { strict: true })
      expect(validatedCategory).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Category data:', JSON.stringify(createdCategory, null, 2))
      throw new Error(`API response doesn't match ICategory interface: ${error.message}`)
    }
  })

  it('should update category using data provider', async () => {
    const result = await ocotilloDataProvider.update({
      resource: 'lexicon/category',
      id: 1,
      variables: {
        name: 'Updated Test Category'
      }
    })

    expect(result).toHaveProperty('data')

    const updatedCategory = result.data as ICategory

    // Validate against schema
    try {
      const validatedCategory = await CategorySchema.validate(updatedCategory, { strict: true })
      expect(validatedCategory).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Category data:', JSON.stringify(updatedCategory, null, 2))
      throw new Error(`API response doesn't match ICategory interface: ${error.message}`)
    }
  })
})
