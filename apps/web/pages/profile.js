import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:4000/api/v1/users/me', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(data => {
        setUser(data.user);
        setDisplayName(data.user.displayName || '');
        setBio(data.user.bio || '');
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('http://localhost:4000/api/v1/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ displayName, bio })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');

      setUser(data.user);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await fetch('http://localhost:4000/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/login';
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>;

  if (error && !user) {
    return (
      <div style={{ maxWidth: '420px', margin: '4rem auto', fontFamily: 'system-ui, sans-serif', padding: '0 1rem' }}>
        <h2>Sign In Required</h2>
        <p>Please log in to view and edit your profile.</p>
        <Link href="/login" style={{ color: '#0066cc', fontWeight: 600 }}>Go to Login</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '3rem auto', fontFamily: 'system-ui, sans-serif', padding: '0 1rem' }}>
      <Head><title>My Profile - ProjectUK</title></Head>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>My Profile</h2>
        <button onClick={handleLogout} style={{ padding: '0.4rem 0.8rem', background: '#eee', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>
          Log Out
        </button>
      </div>

      <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> <span style={{ textTransform: 'capitalize', background: '#e0e7ff', color: '#3730a3', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>{user.role}</span></p>
        <p><strong>Email Verified:</strong> {user.isEmailVerified ? '✅ Yes' : '❌ Pending'}</p>
      </div>

      {message && <div style={{ color: '#2e7d32', background: '#e8f5e9', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>{message}</div>}
      {error && <div style={{ color: '#d32f2f', background: '#ffebee', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us a little about yourself..."
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <button type="submit" style={{ padding: '0.75rem', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
          Save Changes
        </button>
      </form>

      <p style={{ marginTop: '2rem' }}>
        <Link href="/" style={{ color: '#0066cc' }}>← Back to Home</Link>
      </p>
    </div>
  );
}

