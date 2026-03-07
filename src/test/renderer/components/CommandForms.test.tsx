import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import LessonPlanForm from '../../../renderer/components/Commands/LessonPlanForm'
import UnitPlanForm from '../../../renderer/components/Commands/UnitPlanForm'
import ReportCommentsForm from '../../../renderer/components/Commands/ReportCommentsForm'

describe('LessonPlanForm', () => {
  it('renders required fields', () => {
    render(<LessonPlanForm onSubmit={vi.fn()} />)
    expect(screen.getByText('Topic *')).toBeTruthy()
    expect(screen.getByText('Year Level *')).toBeTruthy()
  })

  it('Generate button is disabled when required fields are empty', () => {
    render(<LessonPlanForm onSubmit={vi.fn()} />)
    const btn = screen.getByText(/generate lesson plan/i) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('calls onSubmit with formatted args when form is filled', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<LessonPlanForm onSubmit={onSubmit} />)
    await user.type(screen.getByPlaceholderText(/persuasive writing/i), 'Fractions')
    await user.type(screen.getByPlaceholderText(/year 5\/6/i), 'Year 4')
    fireEvent.click(screen.getByText(/generate lesson plan/i))
    expect(onSubmit).toHaveBeenCalledWith(expect.stringContaining('Topic: Fractions'))
    expect(onSubmit).toHaveBeenCalledWith(expect.stringContaining('Year Level: Year 4'))
  })

  it('omits optional notes when empty', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<LessonPlanForm onSubmit={onSubmit} />)
    await user.type(screen.getByPlaceholderText(/persuasive writing/i), 'Topic')
    await user.type(screen.getByPlaceholderText(/year 5\/6/i), 'Y5')
    fireEvent.click(screen.getByText(/generate lesson plan/i))
    const args = onSubmit.mock.calls[0][0] as string
    expect(args).not.toContain('Additional notes')
  })

  it('includes notes in args when provided', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<LessonPlanForm onSubmit={onSubmit} />)
    await user.type(screen.getByPlaceholderText(/persuasive writing/i), 'Topic')
    await user.type(screen.getByPlaceholderText(/year 5\/6/i), 'Y5')
    await user.type(screen.getByPlaceholderText(/any specific requirements/i), 'Group work focus')
    fireEvent.click(screen.getByText(/generate lesson plan/i))
    expect(onSubmit).toHaveBeenCalledWith(expect.stringContaining('Group work focus'))
  })
})

describe('UnitPlanForm', () => {
  it('renders required fields', () => {
    render(<UnitPlanForm onSubmit={vi.fn()} />)
    expect(screen.getByText('Topic *')).toBeTruthy()
    expect(screen.getByText('Year Level *')).toBeTruthy()
  })

  it('Generate button is disabled when required fields are empty', () => {
    render(<UnitPlanForm onSubmit={vi.fn()} />)
    const btn = screen.getByText(/generate unit plan/i) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('calls onSubmit with formatted args', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<UnitPlanForm onSubmit={onSubmit} />)
    await user.type(screen.getByPlaceholderText(/local environment/i), 'Sustainability')
    await user.type(screen.getByPlaceholderText(/year 7\/8/i), 'Year 6')
    fireEvent.click(screen.getByText(/generate unit plan/i))
    expect(onSubmit).toHaveBeenCalledWith(expect.stringContaining('Topic: Sustainability'))
    expect(onSubmit).toHaveBeenCalledWith(expect.stringContaining('Year Level: Year 6'))
  })
})

describe('ReportCommentsForm', () => {
  it('renders required fields', () => {
    render(<ReportCommentsForm onSubmit={vi.fn()} />)
    expect(screen.getByText('Year Level *')).toBeTruthy()
    expect(screen.getByText('Achievement levels needed *')).toBeTruthy()
  })

  it('Generate button is disabled when required fields are empty', () => {
    render(<ReportCommentsForm onSubmit={vi.fn()} />)
    const btn = screen.getByText(/generate report comments/i) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('calls onSubmit with formatted args', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<ReportCommentsForm onSubmit={onSubmit} />)
    await user.type(screen.getByPlaceholderText(/year 4/i), 'Year 5')
    await user.type(screen.getByPlaceholderText(/3 at, 2 above/i), '4 At, 1 Above')
    fireEvent.click(screen.getByText(/generate report comments/i))
    expect(onSubmit).toHaveBeenCalledWith(expect.stringContaining('Year Level: Year 5'))
    expect(onSubmit).toHaveBeenCalledWith(expect.stringContaining('4 At, 1 Above'))
  })
})
