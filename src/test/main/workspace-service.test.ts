// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

// Mock electron (only used by watcher functions we won't test deeply)
vi.mock('electron', () => ({
  BrowserWindow: vi.fn(),
}))

// Mock chokidar — we test the watcher API at surface level only
vi.mock('chokidar', () => ({
  default: {
    watch: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      close: vi.fn(),
    })),
  },
}))

const {
  initializeWorkspace,
  listWorkspaceFiles,
  readWorkspaceFile,
  writeContextFile,
  listContextFiles,
  listCurriculumFiles,
  importCurriculumFiles,
  deleteCurriculumFile,
  exportFiles,
  startWatcher,
  stopWatcher,
} = await import('../../main/workspace-service')

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workdesk-test-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('initializeWorkspace', () => {
  it('creates context, curriculum, and outputs directories', () => {
    const templatePath = path.join(tmpDir, 'template')
    fs.mkdirSync(templatePath)
    initializeWorkspace(tmpDir, templatePath)
    expect(fs.existsSync(path.join(tmpDir, 'context'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'curriculum'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'outputs'))).toBe(true)
  })

  it('copies CLAUDE.md from template when it exists', () => {
    const templatePath = path.join(tmpDir, 'template')
    fs.mkdirSync(templatePath)
    fs.writeFileSync(path.join(templatePath, 'CLAUDE.md'), '# Template')
    initializeWorkspace(tmpDir, templatePath)
    expect(fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8')).toBe('# Template')
  })

  it('seeds context files from template (skip if already present)', () => {
    const templatePath = path.join(tmpDir, 'template')
    const contextSrc = path.join(templatePath, 'context')
    fs.mkdirSync(contextSrc, { recursive: true })
    fs.writeFileSync(path.join(contextSrc, 'school.md'), 'School info')
    initializeWorkspace(tmpDir, templatePath)
    expect(fs.readFileSync(path.join(tmpDir, 'context', 'school.md'), 'utf8')).toBe('School info')
    // Second call does not overwrite user modifications
    fs.writeFileSync(path.join(tmpDir, 'context', 'school.md'), 'User modified')
    initializeWorkspace(tmpDir, templatePath)
    expect(fs.readFileSync(path.join(tmpDir, 'context', 'school.md'), 'utf8')).toBe('User modified')
  })
})

describe('listWorkspaceFiles', () => {
  it('returns empty array for missing directory', () => {
    expect(listWorkspaceFiles('/nonexistent/path')).toEqual([])
  })

  it('lists files and directories sorted (directories first)', () => {
    fs.mkdirSync(path.join(tmpDir, 'aDir'))
    fs.writeFileSync(path.join(tmpDir, 'b.txt'), '')
    fs.writeFileSync(path.join(tmpDir, 'a.txt'), '')
    const result = listWorkspaceFiles(tmpDir)
    expect(result[0].isDirectory).toBe(true)
    expect(result[0].name).toBe('aDir')
    expect(result[1].name).toBe('a.txt')
    expect(result[2].name).toBe('b.txt')
  })

  it('skips hidden files and node_modules', () => {
    fs.writeFileSync(path.join(tmpDir, '.hidden'), '')
    fs.mkdirSync(path.join(tmpDir, 'node_modules'))
    const result = listWorkspaceFiles(tmpDir)
    expect(result.every(f => !f.name.startsWith('.'))).toBe(true)
    expect(result.every(f => f.name !== 'node_modules')).toBe(true)
  })

  it('includes children for directories within maxDepth', () => {
    const sub = path.join(tmpDir, 'sub')
    fs.mkdirSync(sub)
    fs.writeFileSync(path.join(sub, 'child.txt'), '')
    const result = listWorkspaceFiles(tmpDir)
    const dir = result.find(f => f.name === 'sub')
    expect(dir?.children?.length).toBe(1)
    expect(dir?.children?.[0].name).toBe('child.txt')
  })
})

describe('readWorkspaceFile', () => {
  it('reads file content', () => {
    const p = path.join(tmpDir, 'test.txt')
    fs.writeFileSync(p, 'hello world')
    expect(readWorkspaceFile(p)).toBe('hello world')
  })

  it('throws for files exceeding 1MB', () => {
    const p = path.join(tmpDir, 'big.txt')
    fs.writeFileSync(p, 'x'.repeat(1024 * 1024 + 1))
    expect(() => readWorkspaceFile(p)).toThrow(/too large/i)
  })
})

describe('writeContextFile', () => {
  it('writes content to file, creating parent dirs', () => {
    const p = path.join(tmpDir, 'nested', 'dir', 'file.md')
    writeContextFile(p, '# Content')
    expect(fs.readFileSync(p, 'utf8')).toBe('# Content')
  })
})

describe('listContextFiles', () => {
  it('returns empty when no context dir or CLAUDE.md', () => {
    expect(listContextFiles(tmpDir)).toEqual([])
  })

  it('includes CLAUDE.md when present', () => {
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), '')
    const result = listContextFiles(tmpDir)
    expect(result.some(f => f.name === 'CLAUDE.md')).toBe(true)
  })

  it('includes context directory with children', () => {
    const ctxDir = path.join(tmpDir, 'context')
    fs.mkdirSync(ctxDir)
    fs.writeFileSync(path.join(ctxDir, 'school.md'), '')
    const result = listContextFiles(tmpDir)
    const ctxEntry = result.find(f => f.name === 'context')
    expect(ctxEntry?.isDirectory).toBe(true)
    expect(ctxEntry?.children?.length).toBe(1)
  })
})

describe('listCurriculumFiles', () => {
  it('returns empty when curriculum dir missing', () => {
    expect(listCurriculumFiles(tmpDir)).toEqual([])
  })

  it('lists curriculum files sorted', () => {
    const dir = path.join(tmpDir, 'curriculum')
    fs.mkdirSync(dir)
    fs.writeFileSync(path.join(dir, 'b.pdf'), '')
    fs.writeFileSync(path.join(dir, 'a.pdf'), '')
    const result = listCurriculumFiles(tmpDir)
    expect(result.map(f => f.name)).toEqual(['a.pdf', 'b.pdf'])
  })
})

describe('importCurriculumFiles', () => {
  it('copies files into curriculum directory', () => {
    const src = path.join(tmpDir, 'source.pdf')
    fs.writeFileSync(src, 'pdf content')
    importCurriculumFiles(tmpDir, [src])
    expect(fs.existsSync(path.join(tmpDir, 'curriculum', 'source.pdf'))).toBe(true)
  })
})

describe('deleteCurriculumFile', () => {
  it('deletes an existing file', () => {
    const p = path.join(tmpDir, 'todelete.txt')
    fs.writeFileSync(p, '')
    deleteCurriculumFile(p)
    expect(fs.existsSync(p)).toBe(false)
  })

  it('does not throw if file does not exist', () => {
    expect(() => deleteCurriculumFile('/nonexistent/file.txt')).not.toThrow()
  })
})

describe('exportFiles', () => {
  it('copies files to destination directory', () => {
    const src = path.join(tmpDir, 'report.docx')
    fs.writeFileSync(src, 'doc')
    const dest = path.join(tmpDir, 'export')
    exportFiles([src], dest)
    expect(fs.existsSync(path.join(dest, 'report.docx'))).toBe(true)
  })
})

describe('startWatcher / stopWatcher', () => {
  it('stopWatcher does not throw when nothing is watching', () => {
    expect(() => stopWatcher()).not.toThrow()
  })

  it('startWatcher sets up chokidar watchers', async () => {
    const chokidar = await import('chokidar')
    const mockWin = { webContents: { send: vi.fn() }, isDestroyed: vi.fn(() => false) } as any
    startWatcher(tmpDir, mockWin)
    expect(chokidar.default.watch).toHaveBeenCalledWith(tmpDir, expect.any(Object))
    stopWatcher()
  })
})
