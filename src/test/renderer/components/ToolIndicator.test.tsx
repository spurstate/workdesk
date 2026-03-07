import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import ToolIndicator from '../../../renderer/components/Chat/ToolIndicator'

describe('ToolIndicator', () => {
  it('shows known tool labels', () => {
    render(<ToolIndicator toolName="Read" />)
    expect(screen.getByText('Reading files…')).toBeTruthy()
  })

  it('shows generic label for unknown tool names', () => {
    render(<ToolIndicator toolName="CustomTool" />)
    expect(screen.getByText('Using CustomTool…')).toBeTruthy()
  })

  it('shows correct label for Write tool', () => {
    render(<ToolIndicator toolName="Write" />)
    expect(screen.getByText('Writing document…')).toBeTruthy()
  })

  it('shows correct label for WebSearch tool', () => {
    render(<ToolIndicator toolName="WebSearch" />)
    expect(screen.getByText('Searching the web…')).toBeTruthy()
  })
})
