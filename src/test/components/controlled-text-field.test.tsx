// @vitest-environment jsdom
import React from 'react'
import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'

import { ControlledTextField } from '@/components/Controlled/ControlledTextField'

type FormValues = {
  dateValue: string | null
  textValue: string | null
}

const renderField = ({
  type = 'text',
  label,
  name,
  value = null,
  inputLabelProps,
}: {
  type?: React.HTMLInputTypeAttribute
  label: string
  name: keyof FormValues
  value?: string | null
  inputLabelProps?: Record<string, unknown>
}) => {
  const TestForm = () => {
    const { control } = useForm<FormValues>({
      defaultValues: {
        dateValue: null,
        textValue: null,
        [name]: value,
      },
    })

    return (
      <ControlledTextField
        control={control}
        name={name}
        label={label}
        type={type}
        InputLabelProps={inputLabelProps}
      />
    )
  }

  return render(<TestForm />)
}

describe('ControlledTextField', () => {
  it('shrinks label by default for date inputs with empty values', () => {
    renderField({
      type: 'date',
      label: 'Well Completion Date',
      name: 'dateValue',
      value: null,
    })

    const input = screen.getByLabelText('Well Completion Date')
    const label = document.querySelector(`label[for="${input.id}"]`)
    expect(label).toBeTruthy()
    expect(label?.getAttribute('data-shrink')).toBe('true')
  })

  it('allows callers to override date label shrink behavior', () => {
    renderField({
      type: 'date',
      label: 'First Visit Date',
      name: 'dateValue',
      value: null,
      inputLabelProps: { shrink: false },
    })

    const input = screen.getByLabelText('First Visit Date')
    const label = document.querySelector(`label[for="${input.id}"]`)
    expect(label).toBeTruthy()
    expect(label?.getAttribute('data-shrink')).toBe('false')
  })

  it('keeps default non-date label behavior unchanged', () => {
    renderField({
      type: 'text',
      label: 'Driller Name',
      name: 'textValue',
      value: null,
    })

    const input = screen.getByLabelText('Driller Name')
    const label = document.querySelector(`label[for="${input.id}"]`)
    expect(label).toBeTruthy()
    expect(label?.getAttribute('data-shrink')).toBe('false')
  })
})
