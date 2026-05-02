function App() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Pac-Man AI</p>
        <h1>Browser-first Pac-Man, ready for human and agent controllers.</h1>
        <p className="intro">
          The game core, canvas renderer, and AI controller system are being
          built as separate layers so manual play and automated agents share the
          same action API.
        </p>
      </section>
      <section className="status-card">
        <h2>Current Milestone</h2>
        <p>Project scaffold complete. Game core and canvas renderer next.</p>
      </section>
    </main>
  );
}

export default App;
