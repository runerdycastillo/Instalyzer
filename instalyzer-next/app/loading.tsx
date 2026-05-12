export default function Loading() {
  return (
    <main className="route-state route-state--loading" aria-busy="true" aria-labelledby="route-loading-title">
      <section className="route-state__panel">
        <p className="section-kicker">loading</p>
        <h1 id="route-loading-title">getting things ready</h1>
        <p>preparing your instalyzer workspace.</p>
        <div className="route-state__skeleton" aria-hidden="true">
          <span className="dataset-skeleton-line dataset-skeleton-line--title" />
          <span className="dataset-skeleton-line dataset-skeleton-line--body" />
          <span className="dataset-skeleton-line dataset-skeleton-line--meta" />
        </div>
      </section>
    </main>
  );
}
