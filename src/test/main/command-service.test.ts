// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { buildCommandPrompt } from '../../main/command-service'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'command-test-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

function writeCommandTemplate(templatePath: string, commandName: string, content: string) {
  const dir = path.join(templatePath, '.claude', 'commands')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${commandName}.md`), content)
}

describe('buildCommandPrompt', () => {
  it('substitutes $ARGUMENTS placeholder', () => {
    const templatePath = path.join(tmpDir, 'template')
    writeCommandTemplate(templatePath, 'lesson-plan', 'Topic: $ARGUMENTS\nOutput to: $OUTPUT_DIR')
    const result = buildCommandPrompt(tmpDir, templatePath, 'lesson-plan', 'Fractions Year 5')
    expect(result).toContain('Topic: Fractions Year 5')
  })

  it('substitutes $OUTPUT_DIR with workspace outputs path', () => {
    const templatePath = path.join(tmpDir, 'template')
    writeCommandTemplate(templatePath, 'unit-plan', 'Save to $OUTPUT_DIR')
    const result = buildCommandPrompt(tmpDir, templatePath, 'unit-plan', '')
    expect(result).toBe(`Save to ${path.join(tmpDir, 'outputs')}`)
  })

  it('substitutes $CURRICULUM_DIR with workspace curriculum path', () => {
    const templatePath = path.join(tmpDir, 'template')
    writeCommandTemplate(templatePath, 'report-comments', 'Ref: $CURRICULUM_DIR')
    const result = buildCommandPrompt(tmpDir, templatePath, 'report-comments', '')
    expect(result).toBe(`Ref: ${path.join(tmpDir, 'curriculum')}`)
  })

  it('replaces all occurrences of $ARGUMENTS globally', () => {
    const templatePath = path.join(tmpDir, 'template')
    writeCommandTemplate(templatePath, 'multi', '$ARGUMENTS appears $ARGUMENTS twice')
    const result = buildCommandPrompt(tmpDir, templatePath, 'multi', 'yes')
    expect(result).toBe('yes appears yes twice')
  })

  it('throws when command file does not exist', () => {
    const templatePath = path.join(tmpDir, 'template')
    fs.mkdirSync(path.join(templatePath, '.claude', 'commands'), { recursive: true })
    expect(() => buildCommandPrompt(tmpDir, templatePath, 'nonexistent', '')).toThrow(
      /Command file not found/i
    )
  })
})
