export default function Loading() {
  return (
    <main className="route-state route-state--loading" aria-busy="true" aria-labelledby="route-loading-title">
      <section className="route-state__panel route-state__panel--loading">
        <span className="route-state__loader-mark" aria-hidden="true">
          <span />
        </span>
        <h1 id="route-loading-title" className="visually-hidden">loading instalyzer</h1>
      </section>
    </main>
  );
}
