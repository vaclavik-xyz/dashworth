import { EXAMPLE_PORTFOLIOS } from "@/constants/example-portfolios";
import ExampleSlugShell from "./ExampleSlugShell";

export function generateStaticParams() {
  return EXAMPLE_PORTFOLIOS.map((p) => ({ slug: p.id }));
}

export default async function ExampleSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <ExampleSlugShell slug={slug}>
      {children}
    </ExampleSlugShell>
  );
}
