import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Link as RouterLink } from "react-router";
import { LandingTopbar } from "@/components/LandingTopbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AUTHENTIK_SIGNUP_URL } from "@/config/auth";
import ocotilloImage from "@/img/ocotillo.jpeg";
import waterWellImage from "@/img/ogs-water-well.svg";
import ampImage from "@/img/ogs-amp-project-areas.svg";
import waterElevationImage from "@/img/ogs-water-elevation.svg";

const layers = [
  {
    id: "water-well",
    name: "Water Well Field Operation",
    image: waterWellImage,
    alt: "Water Well Field Operation QGIS screenshot placeholder",
  },
  {
    id: "amp-project-areas",
    name: "AMP project areas",
    image: ampImage,
    alt: "AMP project areas QGIS screenshot placeholder",
  },
  {
    id: "water-elevation",
    name: "Water elevation",
    image: waterElevationImage,
    alt: "Water elevation QGIS screenshot placeholder",
  },
] as const;

const features = [
  [
    "♧",
    "Browse wells on the map",
    "Explore well locations and spatial data across New Mexico.",
  ],
  ["⌕", "Search records", "Find wells by ID, site name, or contact and owner."],
  [
    "▱",
    "View well records",
    "Review water levels, equipment, photos, and contacts.",
  ],
  [
    "⇩",
    "Batch export field compilations",
    "Generate field compilation sheets for groups of wells.",
  ],
  ["?", "Connect to GIS", "Connect Ocotillo to ArcGIS Pro or QGIS."],
] as const;

const faqs = [
  {
    question: "What is Ocotillo?",
    answer: (
      <>
        Ocotillo is an application developed by the Data Services Team at the
        New Mexico Bureau of Geology and Mineral Resources to manage and share
        the Bureau of Geology’s non-cartographic research data. Supported by
        state funding, Ocotillo was developed to make the Bureau of Geology’s
        data more findable for our research scientists. Ocotillo supports the
        goals of the New Mexico Water Data Initiative by storing and serving the
        Bureau of Geology’s water and subsurface data.
      </>
    ),
  },
  {
    question: "Who is Ocotillo for?",
    answer: (
      <>
        Any employee of the New Mexico Bureau of Geology and Mineral Resources
        can have credentials to use Ocotillo by{" "}
        <a
          className="text-primary underline underline-offset-2"
          href={AUTHENTIK_SIGNUP_URL}
          target="_blank"
          rel="noreferrer"
        >
          clicking here to sign up
        </a>
        .
      </>
    ),
  },
  {
    question: "Looking for open data?",
    answer: (
      <>
        Ocotillo serves data to our public applications too! If you aren’t a
        Bureau of Geology employee, use our applications{" "}
        <a
          className="text-primary underline underline-offset-2"
          href="https://weaver.newmexicowaterdata.org/"
        >
          Weaver
        </a>{" "}
        or our{" "}
        <a
          className="text-primary underline underline-offset-2"
          href="/ocotillo/collections"
        >
          public APIs
        </a>
        .
      </>
    ),
  },
] as const;

export const LandingPage = () => {
  const [selectedLayerId, setSelectedLayerId] = useState<string>(layers[0].id);
  const selectedLayer =
    layers.find(({ id }) => id === selectedLayerId) ?? layers[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingTopbar />

      <main className="mx-auto max-w-[1536px] px-4 pt-4 sm:px-8">
        <section
          className="flex min-h-[390px] flex-col items-center justify-center rounded-b-sm bg-cover bg-center px-7 py-16 text-center text-white sm:px-14"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(5, 25, 37, 0.68), rgba(5, 25, 37, 0) 72%), url(${ocotilloImage})`,
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-200">
            Ocotillo
          </p>
          <h1 className="mt-3 max-w-3xl font-heading text-5xl font-bold leading-tight tracking-[-0.04em] sm:text-6xl">
            The Bureau of Geology’s Research Data In One Place
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            Ocotillo is where you can find the New Mexico Bureau of Geology and
            Mineral Resources’ research data.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-6 hover:bg-primary hover:scale-105"
          >
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
              Live GIS Integration (OGC API Features)
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect directly from desktop GIS tools to Ocotillo’s live OGC API
              endpoints. Discover detailed metadata and schemas that flow
              directly into GIS attributes.
            </p>
          </div>
          <Card className="overflow-hidden bg-brand-50 p-0">
            <img
              src={selectedLayer.image}
              alt={selectedLayer.alt}
              className="h-[390px] w-full object-contain"
            />
          </Card>
          <Card className="flex h-full flex-col p-5">
            <CardHeader className="p-0">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">
                Layer preview
              </p>
              <CardTitle className="font-heading text-2xl">
                OGS layers in QGIS
              </CardTitle>
              <CardDescription>
                These previews show screenshots of the highlighted OGS layer
                displayed in QGIS.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-5 flex flex-1 flex-col space-y-2 p-0">
              {layers.map((layer) => (
                <button
                  key={layer.id}
                  type="button"
                  aria-pressed={selectedLayer.id === layer.id}
                  className={`w-full rounded-md border p-3 text-left transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${selectedLayer.id === layer.id ? "border-primary bg-primary/5" : "border-border"}`}
                  onClick={() => setSelectedLayerId(layer.id)}
                >
                  <strong className="font-heading text-sm">{layer.name}</strong>
                </button>
              ))}
              <nav
                aria-label="OGS layer resources"
                className="mt-auto flex flex-wrap gap-3 pt-5"
              >
                <Button asChild variant="outline">
                  <RouterLink to="/ogcapi">How to connect to ArcGIS</RouterLink>
                </Button>
                <Button asChild variant="outline">
                  <RouterLink to="/ocotillo/collections">
                    Browse public datasets
                  </RouterLink>
                </Button>
              </nav>
            </CardContent>
          </Card>
        </section>

        <Separator />
        <section id="how" className="py-8 sm:py-16">
          <div className="max-w-2xl pb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">
              Showcase
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight">
              Individual Feature Highlights
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Explore the core tools that make it easier to discover,
              understand, and work with the Bureau of Geology’s data.
            </p>
          </div>

          <div className="space-y-10">
            <ShowcaseRow
              eyebrow="01"
              title="Interactive Mapping & Visual Exploration"
              description="Address/place search and contextual navigation."
              visual={<MapPreview />}
            />
            <ShowcaseRow
              reverse
              eyebrow="02"
              title="Comprehensive Well & Site Details"
              description="Direct file and photo attachments, integrated source cross-referencing, and project and boundary views. "
              visual={<TablePreview />}
            />
            <ShowcaseRow
              eyebrow="03 · Beta"
              title="Continuous Sensor Data Correction"
              description="Interactive time-series QA/QC with visual editing tools."
              visual={<ChartPreview />}
            />
            <ShowcaseRow
              reverse
              eyebrow="04 · In active development"
              title="Secure, Role-Aware Collaboration & Access"
              description="Separate data catalogs for public and internal data sets, in-app editing for Contacts and Projects."
              visual={<TablePreview />}
            />
          </div>
        </section>

        <Separator />
        <section
          id="faqs"
          aria-labelledby="faqs-heading"
          className="grid gap-8 py-8 sm:py-16 lg:grid-cols-[0.75fr_1.25fr]"
        >
          <div className="max-w-md">
            <h2
              id="faqs-heading"
              className="font-heading text-3xl font-bold tracking-tight"
            >
              FAQs
            </h2>
          </div>
          <Card className="gap-0 overflow-hidden p-0">
            <CardContent className="divide-y p-0">
              {faqs.map(({ question, answer }) => (
                <Collapsible key={question}>
                  <h3>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="group h-auto w-full justify-between gap-4 rounded-none px-5 py-5 text-left whitespace-normal"
                      >
                        <span className="font-heading text-base font-semibold">
                          {question}
                        </span>
                        <ChevronDown className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                      </Button>
                    </CollapsibleTrigger>
                  </h3>
                  <CollapsibleContent className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                    {answer}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CardContent>
          </Card>
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
              See Where We Are Going
            </h2>
            <p className="mt-1 text-muted-foreground">
              Ocotillo is in active development. Interested in learning more
              about what we are working on now and what’s up next? Check out the{" "}
              <a
                className="hover:underline text-primary font-semibold"
                href="https://nmbgmr.atlassian.net/jira/discovery/share/views/e86251f8-f82f-496f-8aaf-0f50c9cf3e1a"
                hrefLang="en-US"
              >
                Ocotillo Roadmap
              </a>{" "}
              (Include a screenshot of the roadmap as the image. Clicking the
              image should take the user to the roadmap as well as the live
              link)
            </p>
          </div>
          <Button asChild size="lg" className="hover:scale-105">
            <a href={AUTHENTIK_SIGNUP_URL} target="_blank" rel="noreferrer">
              Create an account
            </a>
          </Button>
        </section>
      </main>
    </div>
  );
};

const ShowcaseRow = ({
  eyebrow,
  title,
  description,
  visual,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  visual: ReactNode;
  reverse?: boolean;
}) => (
  <article className="grid items-center gap-8 border-t pt-10 lg:grid-cols-2">
    <div className={reverse ? "lg:order-2" : ""}>
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
    <div className={reverse ? "lg:order-1" : ""}>{visual}</div>
  </article>
);

const PreviewWindow = ({ children }: { children: ReactNode }) => (
  <div className="aspect-square w-full overflow-hidden rounded-lg border bg-muted shadow-lg shadow-foreground/5">
    {children}
  </div>
);
const MapPreview = () => (
  <PreviewWindow>
    <img alt="" className="size-full object-cover" />
  </PreviewWindow>
);
const TablePreview = () => (
  <PreviewWindow>
    <img alt="" className="size-full object-cover" />
  </PreviewWindow>
);
const ChartPreview = () => (
  <PreviewWindow>
    <img alt="" className="size-full object-cover" />
  </PreviewWindow>
);
