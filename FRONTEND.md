# Ocotillo UI -- Frontend Guide

A practical reference for working on the Ocotillo front-end. It covers the framework stack, the design system, and how to find and override styles without fighting the tool chain.

---

## Table of Contents

- [Framework Stack Overview](#framework-stack-overview)
- [How the Layers Work Together](#how-the-layers-work-together)
- [Material UI Components](#material-ui-components)
- [Icons](#icons)
- [Refine.dev -- What It Owns](#refinedev----what-it-owns)
- [Color System](#color-system)
- [Typography System](#typography-system)
- [Responsive Grid System](#responsive-grid-system)
- [Where to Override Styles](#where-to-override-styles)
- [How to Find Where a Style Is Coming From](#how-to-find-where-a-style-is-coming-from)
- [Common Patterns](#common-patterns)

---

## Framework Stack Overview

The UI is built on three layers. Understanding which layer owns which concern saves a lot of time.

| Layer | Package | Version | Owns |
| --- | --- | --- | --- |
| **MUI** | `@mui/material` | v6 | All visual components (Button, Card, Drawer, etc.) |
| **MUI DataGrid** | `@mui/x-data-grid` | v8 | All data tables |
| **Refine** | `@refinedev/core`, `@refinedev/mui` | v5 / v8 | Data, routing, auth, CRUD layout wrappers |
| **Ocotillo** | `src/` | — | App-specific business logic, custom components, theme |

**The mental model:** MUI is the component library -- it provides the bricks. Refine is the application frame -- it wires up data, permissions, and navigation. Ocotillo code lives on top of both.

---

## How the Layers Work Together

```
[Refine Provider] -- manages data, auth, routing
  [MUI ThemeProvider] -- applies our custom theme to every MUI component
    [Refine Layout] -- renders Sider + Header + main content area
      [Refine <List> / <Show> / <Edit>] -- CRUD wrappers using MUI Card under the hood
        [MUI DataGrid / Form components] -- actual UI primitives
```

### Key point about Refine components

Refine exports MUI-wrapped components like `<List>`, `<Show>`, `<Edit>`, `<Create>`, `<CreateButton>`, `<ExportButton>`. These are convenience wrappers, not magic. Under the hood they render MUI `Card`, `CardHeader`, `CardContent`, and MUI `Button` components.

Because they are wrappers, they do not always pass every MUI prop through. If you hit a wall trying to style a Refine component, the best move is to replace it with the underlying MUI primitive directly. See `src/pages/ocotillo/thing/list.tsx` for an example -- the Refine `CreateButton` and `ExportButton` were replaced with plain MUI `Button` components to get reliable `size` prop behavior.

**Refine does own a few things you should not fight: &lt;--------------------------------**

- **Navigation** -- sidebar items come from `src/resources/ocotillo.tsx`
- **Document title** -- managed in `src/AppProviders.tsx` via `DocumentTitleHandler`
- **Auth / permissions** -- `CanAccess` wraps any component that should be role-gated
- **Data fetching** -- `useDataGrid`, `useShow`, `useForm` hooks wire components to the API

---

## Material UI Components

The full component library is at [mui.com/material-ui/all-components](https://mui.com/material-ui/all-components/).

The most commonly used in this project:

| Component | Used for |
| --- | --- |
| `Box` | Layout wrapper, replaces `div` with `sx` prop access |
| `Stack` | One-axis flex layout (direction, gap, alignItems) |
| `Typography` | All text. Use the `variant` prop to apply the type scale |
| `Button` | Actions. Default size is `small` (set in theme) |
| `Card` / `Paper` | Surface containers. Paper is a flat Card |
| `Drawer` | The sidebar |
| `AppBar` / `Toolbar` | The top header bar |
| `DataGrid` | All data tables (from `@mui/x-data-grid`) |
| `Autocomplete` | Search inputs with suggestions |
| `TextField` | Text inputs inside forms |
| `IconButton` | Toolbar icon actions |
| `Tooltip` | Hover labels on icon buttons |
| `Divider` | Horizontal rules between sections |

### The `sx` prop

Every MUI component accepts an `sx` prop for one-off styles. It understands theme tokens directly as string references:

```tsx
// Using a theme palette token
<Box sx={{ bgcolor: 'background.paper', color: 'text.secondary' }} />

// Using a theme spacing value (1 = 8px by default)
<Box sx={{ p: 2, mt: 1 }} />

// Responsive values
<Box sx={{ p: { xs: 1, md: 2 } }} />
```

Use `sx` for instance-specific overrides. Use `theme.ts` for global overrides that should apply to every instance of a component.

---

## Icons

Icons come from **`@mui/icons-material`**, a separate package in the MUI family. It contains 2,000+ icons from Google's Material Icons set, each exported as its own React component.

**Browse and search:** [mui.com/material-ui/material-icons](https://mui.com/material-ui/material-icons/) -- click any icon to copy its import path.

### Importing icons

Each icon name maps directly to its import path:

```tsx
import AddIcon from '@mui/icons-material/Add'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import SearchIcon from '@mui/icons-material/Search'
```

Import from the specific path (e.g. `@mui/icons-material/Add`) rather than the barrel export (`@mui/icons-material`) -- it keeps bundle size small by only including what you use.

### Style variants

Every icon is available in five variants. Append the variant name to the icon name:

| Variant | Suffix | Example import |
|---|---|---|
| Filled (default) | *(none)* | `@mui/icons-material/Add` |
| Outlined | `Outlined` | `@mui/icons-material/AddOutlined` |
| Rounded | `Rounded` | `@mui/icons-material/AddRounded` |
| Sharp | `Sharp` | `@mui/icons-material/AddSharp` |
| Two Tone | `TwoTone` | `@mui/icons-material/AddTwoTone` |

Outlined icons are the most common choice in this app for actions and navigation.

### Usage

Icons render as SVGs and accept `sx`, `fontSize`, and `color` props:

```tsx
// Inside a Button (startIcon prop)
<Button startIcon={<AddIcon />} size="small" variant="contained">
  Create
</Button>

// Standalone with sizing
<SearchIcon fontSize="small" />
<SearchIcon sx={{ fontSize: 20 }} />

// With color
<WarningIcon color="warning" />
<WarningIcon sx={{ color: 'text.secondary' }} />
```

---

## Refine.dev -- What It Owns

### Refine v4 → v5 migration notes

The project was upgraded to Refine v5 (with `@refinedev/core` v5 and `@refinedev/mui` v8). Key breaking changes to be aware of:

| Change | v4 | v5 |
|---|---|---|
| Resource hook | `useResource()` | `useResourceParams()` |
| Show data hook return | `queryResult` | `query` |
| DataGrid slots API | `components` prop | `slots` prop (MUI v8 aligned) |

**`useResourceParams`:** Use this instead of `useResource` to get the current resource name and ID from the URL. The returned shape is the same.

**`useShow` / `useForm` return value:** In v5, these hooks return `{ query }` not `{ queryResult }`. Use `query` to access data and loading state:

```ts
// v4 pattern (do not use)
const { queryResult: { data, isLoading } } = useShow()

// v5 correct pattern
const { query: { data, isLoading } } = useShow()
```

**In edit pages**, `useForm` from `@refinedev/react-hook-form` exposes the query via `refineCore.query`. If you need to read the current record's data inside an edit page (e.g. to pre-populate a secondary field), destructure it from `refineCore`:

```ts
const {
  saveButtonProps,
  refineCore: { query },
  control,
} = useForm<IWell, HttpError, Nullable<IWell>>()

// Access the loaded record
const record = query?.data?.data
```

Only destructure `query` from `refineCore` if you actually use it — omit it otherwise to keep the destructuring clean.

---

### Sidebar navigation

Defined in `src/resources/ocotillo.tsx`. Each entry in the `ocotillo` array becomes a nav item. The `meta.icon` sets the sidebar icon. Resources without `list`, `show`, `edit`, or `create` URLs will not appear in the nav.

### Layout components

The layout lives in `src/components/layout/`:

- `index.tsx` -- outer flex container, controls main content padding
- `sider.tsx` -- the permanent/collapsible sidebar drawer
- `header.tsx` -- the top AppBar with search and user avatar
- `title.tsx` -- the "OCOTILLO" wordmark in the sider header

These are local copies of the Refine defaults, which means they can be edited freely without worrying about upstream changes.

### CRUD page wrappers

Refine provides four page-level wrapper components. Each one renders an MUI `Card` with a `CardHeader` (title + action buttons) and `CardContent` (your content). They also handle breadcrumbs, page titles, and action buttons automatically based on the active resource.

| Wrapper | Used for | Default action buttons |
|---|---|---|
| `<List>` | Table/list pages | Create |
| `<Show>` | Detail/view pages | Edit, Delete, back arrow |
| `<Edit>` | Edit form pages | Save, Delete, back arrow |
| `<Create>` | Create form pages | Save, back arrow |

#### Anatomy of a wrapper

```
<Card>                             ← wrapperProps targets this
  <CardHeader>                     ← headerProps targets this
    Breadcrumb
    Title                          ← title prop
    Action buttons                 ← headerButtons prop
  </CardHeader>
  <CardContent>                    ← contentProps targets this
    {children}
  </CardContent>
</Card>
```

#### Styling the wrapper

All four wrappers accept the same three style props:

```tsx
<List
  wrapperProps={{ elevation: 0, sx: { backgroundColor: 'transparent' } }}
  headerProps={{ sx: { '.MuiCardHeader-action': { alignSelf: 'flex-start' } } }}
  contentProps={{ sx: { pt: 1 } }}
>
```

The `wrapperProps` and `contentProps` are passed directly to MUI `Card` and `CardContent`. The `headerProps` are passed to `CardHeader`. This is where you use `.MuiCardHeader-action` to target the button area within the header.

#### Customizing action buttons

Each wrapper has a `headerButtons` prop that replaces the default buttons. It receives `{ defaultButtons }` which you can include or discard:

```tsx
<List
  headerButtons={({ defaultButtons }) => (
    <>
      {defaultButtons}
      <Button size="small" variant="outlined">Custom Action</Button>
    </>
  )}
>
```

If the Refine default buttons (like `CreateButton`) do not behave correctly with MUI props, replace them entirely with plain MUI `Button` components. See `src/pages/ocotillo/thing/list.tsx` for a working example.

#### Data hooks

Each wrapper has a matching data hook that fetches the right data for the active resource and connects it to the UI:

| Wrapper | Hook | What it provides |
|---|---|---|
| `<List>` | `useDataGrid()` | `dataGridProps` for a DataGrid |
| `<Show>` | `useShow()` | `queryResult` with the record data |
| `<Edit>` | `useForm()` from `@refinedev/react-hook-form` | `saveButtonProps`, `control`, `formState` |
| `<Create>` | `useForm()` from `@refinedev/react-hook-form` | same as Edit |

The hooks read the resource name and record ID from the URL automatically -- you do not pass them manually.

#### Real examples in this project

**List page** (`src/components/ListPage.tsx`) -- wraps `<List>` with a custom title block (h3 heading + description) and uses `wrapperProps` to make the Card transparent:

```tsx
<List
  title={<Box><Typography variant="h3">{title}</Typography>...</Box>}
  wrapperProps={{ elevation: 0, sx: { backgroundColor: 'background.wrapper' } }}
  headerProps={{ sx: { '.MuiCardHeader-action': { alignSelf: 'flex-start' } } }}
  contentProps={{ sx: { pt: 1 } }}
>
  <DataGrid {...dataGridProps} />
</List>
```

**Show page** (`src/pages/ocotillo/thing/well-show.tsx`) -- uses `<Show>` directly from `@refinedev/mui` with `useShow()` to load the well record. The children are a custom grid of detail cards:

```tsx
const { query: { data, isLoading } } = useShow<IWell>()  // v5: query (not queryResult)

<Show>
  <Grid container spacing={2}>
    <CoreWellInfoCard well={data?.data} />
    <InteractiveSatelliteMapCard ... />
  </Grid>
</Show>
```

**Edit page** (`src/pages/ocotillo/thing/edit.tsx`) -- uses `<Edit>` with `useForm()` from `@refinedev/react-hook-form`. The `saveButtonProps` from the hook wires up the Save button automatically:

```tsx
const { saveButtonProps, control, formState: { errors } } = useForm<IWell>()

<Edit saveButtonProps={saveButtonProps}>
  <CreateEditWell control={control} errors={errors} />
</Edit>
```

#### When to skip the wrapper

If a page does not need the Card + header layout (e.g. a full-screen map, a dashboard, an about page), skip the wrapper entirely and compose from raw MUI components. The wrapper is a convenience, not a requirement.

---

## Color System

Colors are defined in `src/theme.ts` and sourced entirely from the [Tailwind CSS v3 color palette](https://v3.tailwindcss.com/docs/customizing-colors).

### How it works

`tailwindcss@3` is installed as a devDependency **only as a color value source** — there is no Tailwind CSS processing, no `tailwind.config.js`, no utility classes in templates. The package exports a `colors` object with every Tailwind color as a plain hex value, which is imported directly into `theme.ts`:

```ts
import colors from 'tailwindcss/colors'

colors.blue[700]   // '#1d4ed8'
colors.stone[200]  // '#e7e5e4'
colors.zinc[950]   // '#09090b'
```

The theme uses these values directly for the MUI `palette`. **Do not add Tailwind utility classes (`className="text-blue-700"`)** — they will not work. All styling goes through MUI's `sx` prop and `theme.ts`.

### Palette slots

| Slot | Light mode | Dark mode | Used for |
| --- | --- | --- | --- |
| `primary` | `blue[300/700/900]` | same | Buttons, links, focus rings |
| `secondary` | `amber[300/600/800]` | same | Secondary actions |
| `error` | `red[300/600/800]` | same | Validation errors |
| `warning` | `orange[300/500/700]` | same | Warning alerts |
| `success` | `emerald[300/700/900]` | same | Success states |
| `info` | `cyan[300/600/800]` | same | Info alerts |
| `background.default` | `stone[200]` | `zinc[950]` | Page background, sidebar |
| `background.paper` | `white` | `zinc[700]` | Cards, DataGrid, inputs |
| `background.wrapper` | `stone[100]` | `zinc[800]` | List page wrapper card |
| `divider` | `stone[300]` | `zinc[700]` | Borders, dividers |
| `text.primary` | `slate[900]` | `slate[100]` | Body text |
| `text.secondary` | `slate[500]` | `slate[400]` | Descriptions, labels |

### Changing a color

Open `src/theme.ts` and find the relevant slot in the `palette` block. Change the Tailwind color reference:

```ts
// Change primary from blue to sky
primary: {
  light: colors.sky[300],
  main:  colors.sky[700],
  dark:  colors.sky[900],
},
```

Refer to the [Tailwind v3 color palette](https://v3.tailwindcss.com/docs/customizing-colors) for all available color names and numeric stops (50 through 950). Lighter numbers are lighter colors; darker numbers are darker.

### Custom background tokens

The `TypeBackground` interface is augmented in `src/theme.ts` to add `wrapper` as a custom slot alongside `default` and `paper`. To add another custom token:

```ts
// 1. Augment the interface (already at the top of theme.ts)
declare module '@mui/material/styles' {
  interface TypeBackground {
    wrapper: string
    sider: string  // add new token here
  }
}

// 2. Add the value to the palette
background: {
  sider: mode === 'dark' ? colors.zinc[950] : colors.stone[300],
}

// 3. Use it in sx props or style overrides
<Box sx={{ bgcolor: 'background.sider' }} />
```

---

## Typography System

Fonts are loaded locally via `@fontsource-variable` packages (imported in `src/index.tsx`). There are no Google Fonts CDN dependencies.

| Role | Font | Variants |
| --- | --- | --- |
| Headings (`h1`--`h6`) | Outfit Variable | `700` (h1, h2), `600` (h3--h6) |
| Body, UI, labels | Public Sans Variable | `400`, `500` |
| Wordmark | Outfit Variable | `800` |

### Type scale

| Variant | Size | Weight | Use for |
| --- | --- | --- | --- |
| `h1` | 48px | 700 | Page heroes, marketing |
| `h2` | 36px | 700 | Section titles |
| `h3` | 28px | 600 | Page titles (list pages use this) |
| `h4` | 22px | 600 | Card titles |
| `h5` | 18px | 600 | Sub-section headings |
| `h6` | 16px | 600 | Small headings |
| `deck` | 20px | 400 | Lead paragraph / subtitle text |
| `body1` | 16px | 400 | Default body text |
| `body2` | 14px | 400 | Secondary body text |
| `caption` | 12px | 400 | Labels, metadata |
| `overline` | 11px | 500 | Category labels (uppercase) |
| `button` | \-- | 500 | Button labels (set by MUI) |

```tsx
<Typography variant="h3" fontWeight={700}>Page Title</Typography>
<Typography variant="deck">A lead paragraph or subtitle.</Typography>
<Typography variant="body1" color="text.secondary">Supporting text.</Typography>
<Typography variant="caption">12px metadata label</Typography>
```

---

## Responsive Grid System

The app layout establishes a 12-column grid at the `<Box component="main">` level in `src/components/layout/index.tsx`. On mobile (`xs`), this collapses to 4 columns. Pages that need structured column layouts place their content as Grid items within this foundation.

### MUI breakpoints

MUI's default breakpoints (these are the same values used in all `sx` props and `Grid2` `size` objects across the app):

| Key | Min width | Typical device |
|---|---|---|
| `xs` | 0px | Mobile phones (portrait) |
| `sm` | 600px | Mobile phones (landscape), small tablets |
| `md` | 900px | Tablets, small laptops |
| `lg` | 1200px | Desktops |
| `xl` | 1536px | Large/wide monitors |

Breakpoints are **mobile-first** -- a value set at `md` applies from 900px and up unless a larger breakpoint overrides it.

### Using breakpoints in sx props

Any `sx` prop that accepts a scalar also accepts a breakpoint object:

```tsx
// Stack on mobile, row on desktop
sx={{ flexDirection: { xs: 'column', md: 'row' } }}

// Different padding per breakpoint
sx={{ p: { xs: 1, md: 2, lg: 3 } }}

// Hide on mobile, show on desktop
sx={{ display: { xs: 'none', md: 'block' } }}
```

### Column counts by breakpoint

The app targets a 4-column layout on mobile and 12-column on desktop:

| Breakpoint | Columns | Typical use |
|---|---|---|
| `xs` (0px+) | 4 | Mobile phones |
| `md` (900px+) | 12 | Tablets, desktops |

### Column span cheat sheet

| Layout | `xs` span | `md` span |
|---|---|---|
| Full width | 4 | 12 |
| Half | 2 | 6 |
| One third | 4 | 4 |
| Two thirds | 4 | 8 |
| One quarter | 2 | 3 |

### Using Grid2

Use MUI `Grid2` directly for column layouts. Import it as `Grid` to keep usage concise:

```tsx
import Grid from '@mui/material/Grid2'

// Two equal columns on desktop, stacked on mobile
<Grid container spacing={2}>
  <Grid size={{ xs: 4, md: 6 }}>
    <Card>Left panel</Card>
  </Grid>
  <Grid size={{ xs: 4, md: 6 }}>
    <Card>Right panel</Card>
  </Grid>
</Grid>

// Three equal columns on desktop
<Grid container spacing={2}>
  <Grid size={{ xs: 4, md: 4 }}>Column A</Grid>
  <Grid size={{ xs: 4, md: 4 }}>Column B</Grid>
  <Grid size={{ xs: 4, md: 4 }}>Column C</Grid>
</Grid>

// Asymmetric layout with xl breakpoint
<Grid container spacing={3}>
  <Grid size={{ xs: 12, md: 6, lg: 4, xl: 3 }}>Sidebar</Grid>
  <Grid size={{ xs: 12, lg: 8, xl: 9 }}>Main content</Grid>
</Grid>
```

The `size` prop accepts any breakpoint key (`xs`, `sm`, `md`, `lg`, `xl`). Use the column spans from the cheat sheet above.

### Full-width pages

List pages and the map do not need a grid wrapper. Non-Grid children render as normal block elements and take up the full available width.

### Nested grids

Nesting a `Grid container` inside a `Grid` item (e.g. inside a Refine `<Show>` or `<Edit>` wrapper) is fully supported by MUI Grid2. See `src/pages/ocotillo/thing/well-show.tsx` for an existing example.

### When not to use Grid2

Grid is for column layouts. For stacking items vertically or aligning items in a row, use `Stack` or a `Box` with `display: flex` instead -- they are simpler and don't add grid overhead.

---

## Where to Override Styles

There are three places to put styles, each for a different scope.

### 1. Global -- `src/theme.ts`

Use this for any style that should apply to every instance of an MUI component across the entire app.

Overrides live in the `components` section of `createTheme`:

```ts
components: {
  MuiButton: {
    defaultProps: {
      size: 'small',   // sets the default prop value
    },
    styleOverrides: {
      root: ({ ownerState, theme }) => ({
        // styles apply to every Button
      }),
      sizeSmall: {
        // styles apply only when size="small"
        fontSize: '0.8125rem',
        padding: '4px 12px',
      },
    },
  },
}
```

The component key is always `Mui` + the component name. Common ones already in the theme:

- `MuiButton` -- sizing, variant colors
- `MuiDrawer` -- sidebar background
- `MuiDataGrid` -- table borders, fonts, row styles
- `MuiToolbar` -- gutters/padding
- `MuiCard` -- the `.description` class variant
- `MuiGrid` -- padding reset
- `MuiPaper` -- removes the dark-mode gradient overlay (`backgroundImage: none`)

### 2. Component instance -- `sx` prop

Use this for a style that should only apply to one specific use of a component.

```tsx
<Typography
  variant="body1"
  sx={{ maxWidth: '65ch', mt: 0.5, color: 'text.secondary' }}
>
  Description text.
</Typography>
```

### 3. Inline -- `style` prop

Avoid this unless you have a specific runtime calculation that cannot be expressed as a theme token or `sx` value. Inline styles bypass the theme entirely and cannot respond to dark/light mode.

---

## How to Find Where a Style Is Coming From

When something looks wrong and you are not sure what is controlling it, work through this checklist:

**Step 1: Identify the MUI class name in the browser**

Open DevTools, inspect the element, and note the class names. MUI generates classes like:

- `MuiButton-root` -- the component + slot
- `MuiButton-sizeSmall` -- the component + variant/state slot
- `css-abc123-MuiButton-root` -- the generated hash, which is what actually applies the styles

The human-readable class names (`MuiButton-root`) tell you the component name and slot. Use these to find the override key in `theme.ts`.

**Step 2: Check** `theme.ts` **first**

Look in the `components` block of `src/theme.ts` for an entry matching the class name prefix. For example, `MuiButton-sizeSmall` maps to `MuiButton.styleOverrides.sizeSmall`.

**Step 3: Check the component file**

Search for the component in `src/` -- either the page file or the shared component in `src/components/`. Look for `sx` props or `style` props on the element.

**Step 4: Check Refine wrapper props**

If the element is inside a Refine `<List>`, `<Show>`, or `<Edit>`, it may be getting styles from the `wrapperProps`, `headerProps`, or `contentProps` passed to that wrapper. See `src/components/ListPage.tsx`.

**Step 5: Check if Refine is applying its own defaults**

Refine's MUI integration (`@refinedev/mui`) ships with some default styles. If you see a style you cannot trace to your code, it may be coming from the Refine theme. The solution is usually to add an explicit override in `theme.ts` or to replace the Refine wrapper with a plain MUI component.

### Searching the codebase

```bash
# Find all files that reference a specific MUI component
grep -r "MuiButton" src/

# Find where a CSS class is being applied in sx props
grep -r "MuiCardHeader-action" src/
```

---

## Common Patterns

### Adding a new list page

Use the `ListPage` component in `src/components/ListPage.tsx`. It handles the Refine `<List>` wrapper, breadcrumbs, DataGrid, and export button. Pass `title`, `description`, `columns`, and `dataGridProps`:

```tsx
import { ListPage } from '@/components/ListPage'
import { useDataGrid } from '@refinedev/mui'

export const MyResourceList = () => {
  const { dataGridProps } = useDataGrid({ resource: 'my-resource' })

  const columns = [
    { field: 'id', headerName: 'ID', width: 100 },
    { field: 'name', headerName: 'Name', flex: 1 },
  ]

  return (
    <ListPage
      title="My Resources"
      description="A short sentence describing what these are."
      columns={columns}
      dataGridProps={dataGridProps}
    />
  )
}
```

### Using theme palette colors in a component

Prefer `sx` prop string references over importing `useTheme` for simple cases:

```tsx
// Simple -- use the token name directly as a string
<Box sx={{ bgcolor: 'background.paper', borderColor: 'divider' }} />

// When you need the actual hex value (e.g. for inline styles or non-sx APIs)
import { useTheme } from '@mui/material/styles'

const theme = useTheme()
const color = theme.palette.primary.main  // '#1d4ed8'
```

### Overriding a Refine button component

If a Refine button (`CreateButton`, `ExportButton`, etc.) is not behaving as expected with MUI props, replace it with a plain MUI `Button`:

```tsx
import { Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'

<Button
  size="small"
  variant="outlined"
  startIcon={<AddIcon />}
  onClick={() => push('/my-resource/create')}
>
  Create
</Button>
```

### Debugging dark mode

The theme switch is at the bottom of the sidebar. The `ColorModeContext` in `src/contexts/index.tsx` controls the active mode. The `getTheme(mode)` function in `src/theme.ts` receives `'light'` or `'dark'` and returns a full theme object for each. If a style is correct in one mode but not the other, check whether the affected palette slot has a conditional: `mode === 'dark' ? ... : ...`.