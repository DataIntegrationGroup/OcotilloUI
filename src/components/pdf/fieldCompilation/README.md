# Field Compilation PDF Modules

## Architecture After Refactor (Steps 3–8)

The `FieldCompilationNotesPdf` module has been refactored into composable, focused components.

### Module Structure

```
src/components/pdf/
├── FieldCompilationNotesPdf.tsx    # Thin re-export wrapper (42 lines)
└── fieldCompilation/
    ├── page.tsx                    # Document orchestrator + all UI components (~870 lines)
    ├── table.tsx                   # Generic PdfTable + TableColumn type
    ├── section.tsx                 # NoteSection component
    ├── format.ts                   # 14 pure helper functions (format, render, parse)
    └── styles.ts                   # Style creation utilities
```

### Component Responsibilities

| File | Exports | Purpose |
|------|---------|---------|
| `page.tsx` | `FieldCompilationNotesPdf`, `FieldCompilationNotesPage`, `NoteSection` | Document layout, page generation, section rendering |
| `table.tsx` | `PdfTable`, `TableColumn<T>` | Generic tabular data rendering with dynamic columns |
| `section.tsx` | `NoteSection` | Title-accent bar + content card for sections |
| `format.ts` | 14 helpers (`renderValue`, `formatNumeric`, `notesToText`, etc.) | Pure value transformations (no React dependencies) |
| `styles.ts` | `createFieldCompilationStyles`, `FieldCompilationStyles` | Density-aware style generation |

### Usage Patterns

**Embed mode** (in existing Document context):
```tsx
import { FieldCompilationNotesPage } from '@/components/pdf/fieldCompilation/page'
// <FieldCompilationNotesPage well={...} contacts={...} ... />
```

**Standalone PDF export:**
```tsx
import { FieldCompilationNotesPdf } from '@/components/pdf/FieldCompilationNotesPdf'
// Returns full Document element with multi-page rendering
```

### Public API (Backward Compatible)

All original exports remain available through the entry point:
- `FieldCompilationNotesPdf` — main document component
- `directionNotesValue` — direction notes formatter

### Testing

All 10 existing tests pass without modification. Test coverage verified in:
- `src/test/components/FieldCompilationNotesPdf.test.ts` (10 tests)
- `src/test/components/fieldSheetPageOneMock.test.ts`
- `src/test/components/fieldSheetDirectionNotes.test.ts`

### Key Decisions

1. **Page-level abstraction**: `FieldCompilationNotesPage` renders page content; the Document wrapper handles multi-page orchestration in `page.tsx`.
2. **Type exports**: `TableColumn<T>` exported from `table.tsx` for external consumers needing generic table definitions.
3. **No breaking changes**: All original import paths continue to work via re-exports.
