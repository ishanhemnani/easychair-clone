'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Conference { id: string; title: string; }

export default function SubmitPaperPage() {
  const { token } = useAuth();
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [form, setForm] = useState({
    title: '',
    abstract: '',
    conference_id: '',
    file: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetch(`${API_BASE}/conferences`).then(res => res.json()).then(data => setConferences(data.conferences || []));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, file: e.target.files?.[0] || null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(false);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('abstract', form.abstract);
      fd.append('conference_id', form.conference_id);
      if (form.file) fd.append('file', form.file);
      const res = await fetch(`${API_BASE}/papers/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Submission failed');
      setSuccess(true);
      setForm({ title: '', abstract: '', conference_id: '', file: null });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Submit Paper</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">Paper submitted successfully!</div>}
      <form className="space-y-4 bg-white p-4 rounded shadow" onSubmit={handleSubmit}>
        <input className="w-full border px-2 py-1 rounded" name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
        <textarea className="w-full border px-2 py-1 rounded" name="abstract" placeholder="Abstract" value={form.abstract} onChange={handleChange} required />
        <select className="w-full border px-2 py-1 rounded" name="conference_id" value={form.conference_id} onChange={handleChange} required>
          <option value="">Select Conference</option>
          {conferences.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <input className="w-full border px-2 py-1 rounded" name="file" type="file" accept=".pdf,.zip" onChange={handleFile} required />
        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</button>
      </form>
    </div>
  );
} 