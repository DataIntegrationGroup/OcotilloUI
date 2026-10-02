import { useState, type ReactNode } from 'react'
import { Link as RouterLink } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AUTHENTIK_SIGNUP_URL } from '@/config/auth'
import ocotilloImage from '@/img/ocotillo.jpeg'

const records = [
  [
    'WL-0433',
    'Santa Ana Seep Spring',
    'sampled May 15, 2026',
    'Current',
    'filterEmerald',
    'Santa Fe Group aquifer · 35.4421° N, 106.8273° W',
  ],
  [
    'WL-1187',
    'Corrales monitoring well',
    'sampled Apr 29, 2026',
    'Review',
    'secondary',
    'Rio Grande basin · 35.2328° N, 106.6064° W',
  ],
  [
    'WL-0902',
    'Rio Rancho well',
    'sampled May 03, 2026',
    'Sampled',
    'filter',
    'Santa Fe Group aquifer · 35.2697° N, 106.7486° W',
  ],
] as const

const features = [
  [
    '♧',
    'Browse wells on the map',
    'Explore well locations and spatial data across New Mexico.',
  ],
  ['⌕', 'Search records', 'Find wells by ID, site name, or contact and owner.'],
  [
    '▱',
    'View well records',
    'Review water levels, equipment, photos, and contacts.',
  ],
  [
    '⇩',
    'Batch export field compilations',
    'Generate field compilation sheets for groups of wells.',
  ],
  ['?', 'Connect to GIS', 'Connect Ocotillo to ArcGIS Pro or QGIS.'],
] as const

export const LandingPage = () => {
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    records[0][0]
  )
  const selectedRecord =
    records.find(([id]) => id === selectedRecordId) ?? records[0]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1536px] items-center justify-between px-4 sm:px-8">
          <RouterLink
            to="/"
            className="font-heading text-base font-extrabold uppercase tracking-[0.2em]"
          >
            Ocotillo
          </RouterLink>
          <nav className="flex items-center gap-1 sm:gap-3">
            <a
              href="#explore"
              className="hidden px-2 text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              Explore
            </a>
            <a
              href="#how"
              className="hidden px-2 text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              How it works
            </a>
            <Button asChild variant="outline" size="sm">
              <RouterLink to="/login">Log in</RouterLink>
            </Button>
            <Button asChild size="sm">
              <a href={AUTHENTIK_SIGNUP_URL} target="_blank" rel="noreferrer">
                Sign up
              </a>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1536px] px-4 sm:px-8">
        <section
          className="flex min-h-[390px] flex-col items-center justify-center rounded-b-sm bg-cover bg-center px-7 py-16 text-center text-white sm:px-14"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(5, 25, 37, 0.68), rgba(5, 25, 37, 0) 72%), url(${ocotilloImage})`,
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-200">
            A clearer view of the water system
          </p>
          <h1 className="mt-3 max-w-3xl font-heading text-5xl font-bold leading-tight tracking-[-0.04em] sm:text-6xl">
            Explore the data beneath the map.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            Find the well, spring, sample, or trend that answers the question in
            front of you.
          </p>
          <Button asChild size="lg" className="mt-6">
            <a href={AUTHENTIK_SIGNUP_URL} target="_blank" rel="noreferrer">
              Create an account
            </a>
          </Button>
        </section>

        <section
          id="explore"
          className="grid gap-4 py-9 lg:grid-cols-[1.25fr_0.75fr]"
        >
          <div className="lg:col-span-2">
            <h2 className="font-heading text-3xl font-bold tracking-tight">
              Explore connected records
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Explore connected monitoring layers and nearby well records in one
              place.
            </p>
          </div>
          <Card className="overflow-hidden bg-brand-50 p-0">
            <div className="flex items-center gap-2 border-b bg-card p-3">
              <Badge variant="filter">184 points</Badge>
              <Button variant="outline" size="xs">
                All counties
              </Button>
              <Button variant="outline" size="xs">
                All types
              </Button>
            </div>
            <div className="relative h-[390px] overflow-hidden bg-[radial-gradient(ellipse_at_52%_35%,hsl(var(--brand-200)/.75),transparent_48%),linear-gradient(145deg,hsl(var(--sand)),hsl(var(--brand-100)))]">
              <div className="absolute left-1/2 top-[-30px] h-[470px] w-2.5 rotate-[17deg] rounded-full bg-primary/60" />
              {[
                ['left-[26%] top-[33%]', '1'],
                ['left-[57%] top-[22%] bg-bloom', '2'],
                ['left-[69%] top-[58%]', '3'],
                ['left-[38%] top-[72%] bg-success', '4'],
              ].map(([position, label]) => (
                <button
                  key={label}
                  type="button"
                  aria-label={`Map point ${label}`}
                  className={`absolute ${position} z-10 flex size-6 -rotate-45 items-center justify-center rounded-full rounded-bl-none border-[3px] border-white bg-primary text-[10px] text-white shadow`}
                  onClick={() =>
                    setSelectedRecordId(
                      records[(Number(label) - 1) % records.length][0]
                    )
                  }
                >
                  <span className="rotate-45">{label}</span>
                </button>
              ))}
              <div className="absolute bottom-3 left-3 rounded-md border bg-card px-3 py-2 text-[11px] shadow-sm">
                <span className="mr-1 inline-block size-2 rounded-full bg-primary" />{' '}
                Monitoring point{' '}
                <span className="mx-2 inline-block size-2 rounded-full bg-bloom" />{' '}
                Review needed
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <CardHeader className="p-0">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">
                Sample workspace
              </p>
              <CardTitle className="font-heading text-2xl">
                Nearby records
              </CardTitle>
              <CardDescription>
                Sandoval County · Rio Grande basin
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-5 space-y-2 p-0">
              {records.map((record) => (
                <button
                  key={record[0]}
                  type="button"
                  className={`w-full rounded-md border p-3 text-left transition-colors hover:border-primary hover:bg-primary/5 ${selectedRecord[0] === record[0] ? 'border-primary bg-primary/5' : 'border-border'}`}
                  onClick={() => setSelectedRecordId(record[0])}
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="font-heading text-sm">
                      {record[0]}
                    </strong>
                    <Badge variant={record[4]}>{record[3]}</Badge>
                  </div>
                  <small className="mt-1 block text-xs text-muted-foreground">
                    {record[1]} · {record[2]}
                  </small>
                </button>
              ))}
              <div className="border-t pt-4 text-xs">
                <span className="text-muted-foreground">Selected record</span>
                <strong className="mt-1 block font-heading text-xl">
                  {selectedRecord[0]}
                </strong>
                <span className="text-muted-foreground">
                  {selectedRecord[5]}
                </span>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />
        <section id="how" className="py-8 sm:py-16">
          <div className="max-w-2xl pb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">
              A clearer path through the data
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight">
              From the first question to the field decision.
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Keep the map, the record, and the evidence together as the work
              moves from exploration to a defensible answer.
            </p>
          </div>
          <div className="space-y-10">
            <ShowcaseRow
              eyebrow="01 · Find the place"
              title="Start with the question, not a blank map."
              description="Search by well, county, aquifer, or site name and quickly see which records can help answer the question in front of you."
              visual={<MapPreview />}
            />
            <ShowcaseRow
              reverse
              eyebrow="02 · Keep the evidence"
              title="See the record behind every point."
              description="Move from a location to the measurements, sample history, and field context that make the record useful to the whole team."
              visual={<TablePreview />}
            />
            <ShowcaseRow
              eyebrow="03 · Share the signal"
              title="Turn field observations into shared context."
              description="Compare trends, prepare a clear handoff, and bring the same trustworthy view into the tools your team already uses."
              visual={<ChartPreview />}
            />
          </div>
        </section>

        <Separator />
        <section className="py-8 sm:py-16">
          <div className="mb-7 max-w-2xl">
            <h2 className="font-heading text-3xl font-bold tracking-tight">
              What you can do now
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              Bring the map, the record, and the field sheet into the same
              conversation.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(([icon, title, description]) => (
              <Card key={title} className="min-h-48 p-5">
                <CardContent className="p-0">
                  <div className="mb-5 text-2xl text-primary">{icon}</div>
                  <h3 className="font-heading text-lg font-semibold">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <section className="mb-8 flex flex-col items-start justify-between gap-5 rounded-xl border border-primary/25 bg-primary/10 p-7 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-heading text-2xl font-semibold">
              Ready to make the next question easier?
            </h2>
            <p className="mt-1 text-muted-foreground">
              Start building a clearer view of New Mexico water data.
            </p>
          </div>
          <Button asChild size="lg">
            <a href={AUTHENTIK_SIGNUP_URL} target="_blank" rel="noreferrer">
              Create an account
            </a>
          </Button>
        </section>
      </main>
    </div>
  )
}

const ShowcaseRow = ({
  eyebrow,
  title,
  description,
  visual,
  reverse = false,
}: {
  eyebrow: string
  title: string
  description: string
  visual: ReactNode
  reverse?: boolean
}) => (
  <article
    className={`grid items-center gap-8 border-t pt-10 lg:grid-cols-[0.9fr_1.1fr] ${reverse ? 'lg:grid-cols-[1.1fr_0.9fr]' : ''}`}
  >
    <div className={reverse ? 'lg:order-2' : ''}>
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">
        {eyebrow}
      </p>
      <h3 className="mt-3 max-w-md font-heading text-2xl font-semibold leading-tight">
        {title}
      </h3>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
    <div className={reverse ? 'lg:order-1' : ''}>{visual}</div>
  </article>
)

const PreviewWindow = ({ children }: { children: ReactNode }) => (
  <div className="overflow-hidden rounded-lg border bg-card shadow-lg shadow-foreground/5">
    <div className="flex h-7 items-center gap-1 border-b bg-muted px-3">
      <i className="size-1.5 rounded-full bg-border" />
      <i className="size-1.5 rounded-full bg-border" />
      <i className="size-1.5 rounded-full bg-border" />
    </div>
    {children}
  </div>
)
const MapPreview = () => (
  <PreviewWindow>
    <div className="grid h-56 gap-3 p-3 sm:grid-cols-[1.1fr_0.9fr]">
      <div className="relative rounded-md bg-primary/10">
        <i className="absolute left-1/4 top-1/3 size-3 rounded-full border-2 border-card bg-primary" />
        <i className="absolute left-3/5 top-3/5 size-3 rounded-full border-2 border-card bg-bloom" />
        <i className="absolute right-1/5 top-1/4 size-3 rounded-full border-2 border-card bg-primary" />
      </div>
      <div className="space-y-2">
        <div className="h-2 w-3/4 rounded bg-foreground" />
        <div className="h-1.5 w-11/12 rounded bg-border" />
        <div className="h-1.5 w-3/5 rounded bg-border" />
        <div className="rounded border p-2">
          <strong className="block text-xs">WL-0433</strong>
          <span className="text-[9px] text-muted-foreground">
            Santa Ana Seep Spring
          </span>
        </div>
        <div className="rounded border p-2">
          <strong className="block text-xs">WL-1187</strong>
          <span className="text-[9px] text-muted-foreground">
            Corrales monitoring well
          </span>
        </div>
      </div>
    </div>
  </PreviewWindow>
)
const TablePreview = () => (
  <PreviewWindow>
    <div className="space-y-1 p-4 text-[10px] text-muted-foreground">
      {[
        ['Parameter', 'Result', 'Unit'],
        ['Water level', '42.6', 'ft'],
        ['Specific conductance', '618', 'µS/cm'],
        ['Temperature', '18.4', '°C'],
        ['Sample date', '05/15/26', 'local'],
      ].map((row, index) => (
        <div
          key={row[0]}
          className={`grid grid-cols-[1.2fr_0.8fr_0.7fr] gap-2 border-b py-2 ${index === 0 ? 'font-semibold text-foreground' : ''}`}
        >
          {row.map((cell) => (
            <span key={cell}>{cell}</span>
          ))}
        </div>
      ))}
    </div>
  </PreviewWindow>
)
const ChartPreview = () => (
  <PreviewWindow>
    <div className="p-4">
      <div className="h-2 w-3/5 rounded bg-foreground" />
      <div className="mt-3 flex h-36 items-end gap-3 border-b bg-[repeating-linear-gradient(to_bottom,transparent_0_35px,hsl(var(--border))_36px_37px)] px-5 pt-4">
        {['h-2/5', 'h-2/3', 'h-[88%]', 'h-1/2', 'h-3/4'].map(
          (height, index) => (
            <i
              key={index}
              className={`flex-1 rounded-t bg-primary ${height} ${index === 4 ? 'bg-bloom' : ''}`}
            />
          )
        )}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Water level trend · Santa Ana Seep Spring
      </p>
    </div>
  </PreviewWindow>
)
