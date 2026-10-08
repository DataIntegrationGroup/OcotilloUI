import { useContext, useState, type ReactNode } from "react";
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
import { AUTHENTIK_SIGNUP_URL } from "@/config/auth";
import ocotilloImage from "@/img/ocotillo.jpeg";
import roadmapImage from "@/img/ocotillo-roadmap.png";
import waterWellImage from "@/img/ogs-water-well.png";
import ampImage from "@/img/ogs-amp-project-areas.png";
import waterElevationImage from "@/img/ogs-water-elevation.png";
import authDarkImage from "@/img/auth-dark.png";
import authLightImage from "@/img/auth-light.png";
import mapDarkImage from "@/img/map-dark.png";
import mapLightImage from "@/img/map-light.png";
import sensorCorrectorDarkImage from "@/img/sensorcorrector-dark.png";
import sensorCorrectorLightImage from "@/img/sensorcorrector-light.png";
import wellDetailDarkImage from "@/img/welldetail-dark.png";
import wellDetailLightImage from "@/img/welldetail-light.png";
import { ColorModeContext } from "@/contexts";

const OCOTILLO_ROADMAP_URL =
  "https://nmbgmr.atlassian.net/jira/discovery/share/views/e86251f8-f82f-496f-8aaf-0f50c9cf3e1a";

const layers = [
  {
    id: "water-well",
    name: "Groundwater Well Locations",
    image: waterWellImage,
    alt: "Groundwater Well Locations QGIS screenshot placeholder",
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
        can have credentials to use Ocotillo by clicking{" "}
        <a
          className="text-primary underline underline-offset-2"
          href={AUTHENTIK_SIGNUP_URL}
          target="_blank"
          rel="noreferrer"
        >
          here
        </a>{" "}
        to sign up.
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
            Ocotillo is for employees of the New Mexico Bureau of Geology and
            Mineral Resources to find, manage, and share the Bureau’s research
            data.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-6 hover:bg-primary hover:scale-105"
          >
            <a href={AUTHENTIK_SIGNUP_URL} target="_blank" rel="noreferrer">
              Request an account
            </a>
          </Button>
        </section>

        <section
          id="faqs"
          aria-labelledby="faqs-heading"
          className="grid gap-8 py-8 sm:py-16"
        >
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            {faqs.map(({ question, answer }) => (
              <div key={question}>
                <h3 className="font-heading text-lg font-semibold">
                  {question}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {answer}
                </p>
              </div>
            ))}
          </div>
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
              Connect QGIS, ArcGIS Pro, or other desktop GIS tools directly to
              Ocotillo's live data services, with no downloading or re-exporting
              files. Layers always reflect the latest data, and field names,
              descriptions, and metadata come through automatically as GIS
              attributes, so you can start analyzing right away. OGC API
              Features is an open standard, so it works with any compatible GIS
              software.
            </p>
          </div>
          <Card className="h-full overflow-hidden bg-brand-50 p-0">
            <img
              src={selectedLayer.image}
              alt={selectedLayer.alt}
              className="h-full w-full object-contain"
            />
          </Card>
          <Card className="flex h-full flex-col p-5">
            <CardHeader className="p-0">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">
                Layer preview
              </p>
              <CardTitle className="font-heading text-2xl">
                OGC layers in QGIS
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
                  <RouterLink to="/ogcapi">
                    How to connect to Desktop GIS
                  </RouterLink>
                </Button>
              </nav>
            </CardContent>
          </Card>
        </section>

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
              description="Explore the Bureau's data on a map. Search by place, address, or ZIP code, switch base maps, and turn dataset layers on and off to see wells and other features across New Mexico. Draw a polygon or rectangle to focus on an area, and Ocotillo shows how many features are in view along with summary details for each, such as well depth and elevation. You can export what's visible as CSV or GeoJSON for use in your own analysis."
              visual={
                <ShowcaseImage
                  lightImage={mapLightImage}
                  darkImage={mapDarkImage}
                  alt="Ocotillo interactive mapping and visual exploration"
                />
              }
            />
            <ShowcaseRow
              reverse
              eyebrow="02"
              title="Comprehensive Well & Site Details"
              description="Each well or site has a single record that brings together what's known about it. You'll find construction details like hole depth, well depth, and measuring point, along with a location map, owner and contact information, and category tags such as use type, public status, and river basin. Photos and files are attached directly to the record. Cross-references to related source records and project and boundary views show how a site fits into the Bureau's broader work. Records can be previewed or downloaded as a PDF, so field-ready summaries are easy to create and share."
              visual={
                <ShowcaseImage
                  lightImage={wellDetailLightImage}
                  darkImage={wellDetailDarkImage}
                  alt="Ocotillo comprehensive well and site details"
                />
              }
            />
            <ShowcaseRow
              eyebrow="03 · In active development"
              title="HydroSync: Continuous Sensor Data Correction Tool"
              description="HydroSync cleans up continuous water-level data from pressure transducers. Upload a transducer file and Ocotillo tries to identify the well automatically, with a well search as a fallback. A visual, interactive hydrograph then lets you correct the data instead of editing raw numbers. The Simple mode handles common fixes: converting water head, removing offsets and zeros, shifting the series, and snapping it to a manual measurement. Intermediate and Advanced modes are shown for more complex corrections."
              visual={
                <ShowcaseImage
                  lightImage={sensorCorrectorLightImage}
                  darkImage={sensorCorrectorDarkImage}
                  alt="Ocotillo continuous sensor data correction"
                />
              }
            />
            <ShowcaseRow
              reverse
              eyebrow="04 · In active development"
              title="Secure, Role-Aware Collaboration & Access"
              description="Ocotillo separates public and internal data catalogs, so open data stays easy to find while internal datasets are limited to authorized staff. What each user can see or do depends on their role. Staff can also edit Contacts and Projects in the app instead of maintaining them in separate tools."
              visual={
                <ShowcaseImage
                  lightImage={authLightImage}
                  darkImage={authDarkImage}
                  alt="Ocotillo secure, role-aware collaboration and access"
                />
              }
            />
          </div>
        </section>

        <section className="mb-8 flex flex-col items-start justify-between gap-5 rounded-xl border border-primary/25 bg-primary/10 p-7 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2">
            <div>
              <h2 className="font-heading text-2xl font-semibold">
                See Where We Are Going
              </h2>
              <p className="mt-1 text-muted-foreground">
                Ocotillo is in active development. Interested in learning more
                about what we are working on now and what’s up next? Check out
                the{" "}
                <a
                  className="hover:underline text-primary font-semibold"
                  href={OCOTILLO_ROADMAP_URL}
                  hrefLang="en-US"
                  target="_blank"
                  rel="noreferrer"
                >
                  Ocotillo Roadmap
                </a>
                .
              </p>
            </div>
            <a
              className="block w-full shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              href={OCOTILLO_ROADMAP_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Open the Ocotillo Roadmap"
            >
              <div className="w-full overflow-hidden rounded-lg border bg-muted shadow-lg shadow-foreground/5">
                <img
                  src={roadmapImage}
                  alt="Ocotillo roadmap preview"
                  className="h-auto w-full object-contain"
                />
              </div>
            </a>
          </div>
          <Button asChild size="lg" className="hover:scale-105">
            <a href={AUTHENTIK_SIGNUP_URL} target="_blank" rel="noreferrer">
              Request an account
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
  <div className="aspect-[3/2] w-full overflow-hidden rounded-lg border bg-muted shadow-lg shadow-foreground/5">
    {children}
  </div>
);

const ShowcaseImage = ({
  lightImage,
  darkImage,
  alt,
}: {
  lightImage: string;
  darkImage: string;
  alt: string;
}) => {
  const { mode } = useContext(ColorModeContext);

  return (
    <PreviewWindow>
      <img
        src={mode === "dark" ? darkImage : lightImage}
        alt={alt}
        className="size-full rounded-[2px] border border-foreground/30 object-fill"
      />
    </PreviewWindow>
  );
};
