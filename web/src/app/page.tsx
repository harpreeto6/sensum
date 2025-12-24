export default async function Home() {
  const res = await fetch("http://localhost:3000/api/health", { cache: "no-store" });
  const text = await res.text();

  return (
    <main style={{ padding: 24 }}>
      <h1>Sensum</h1>
      <p>Backend health: {text}</p>
    </main>
  );
}
