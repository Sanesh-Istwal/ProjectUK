import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <Head>
        <title>ProjectUK - Interactive Stories & Maps</title>
        <meta name="description" content="Discover interactive stories and map markers across the UK" />
      </Head>

      <header style={{ borderBottom: '1px solid #eaeaea', paddingBottom: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>ProjectUK</h1>
          <p style={{ color: '#666', marginTop: '0.5rem', marginBottom: 0 }}>Interactive map & user stories pilot</p>
        </div>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/login" style={{ color: '#0066cc', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
          <Link href="/signup" style={{ background: '#0066cc', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '4px', textDecoration: 'none', fontWeight: 500 }}>Sign Up</Link>
          <Link href="/profile" style={{ color: '#555', textDecoration: 'none' }}>Profile</Link>
        </nav>
      </header>

      <main>
        <section style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0 }}>🗺️ Interactive Map</h2>
          <p style={{ color: '#555' }}>
            MapLibre GL map powered by open-source OpenStreetMap tiles.
          </p>
          <div style={{ height: '300px', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}>
            <span>Map viewport container (MapLibre GL JS)</span>
          </div>
        </section>

        <section style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0 }}>📖 Stories & Gallery</h2>
          <p style={{ color: '#555' }}>
            User submitted stories and photos will be published here after moderation.
          </p>
        </section>
      </main>
    </div>
  );
}
