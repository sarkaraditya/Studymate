import { notFound } from 'next/navigation';

const PAGES = {
  planner: ['Study Planner', 'Plan what to study and when.'],
  settings: ['Settings', 'Manage your account and preferences.'],
};

export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(PAGES).map((slug) => ({ slug })); }

export default async function Stub({ params }) {
  const { slug } = await params;
  const p = PAGES[slug];
  if (!p) notFound();
  return (
    <>
      <div className="mhead"><div><h1>{p[0]}</h1><p>{p[1]}</p></div></div>
      <div className="card empty">Coming soon. This page is not part of the first design round.</div>
    </>
  );
}
