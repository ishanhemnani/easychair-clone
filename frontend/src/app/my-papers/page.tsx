'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Paper {
  id: string;
  title: string;
  status: string;
  file_url: string;
}

export default function MyPapersPage() {
  const { token } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

  const fetchPapers = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/papers/my-papers`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setPapers(data.papers || []);
    } catch (err) {
      setError('Failed to fetch papers');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchPapers(); }, []);

  const handleWithdraw = async (id: string) => {
    if (!window.confirm('Withdraw this paper?')) return;
    setWithdrawing(id); setError(null);
    try {
      const res = await fetch(`${API_BASE}/papers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to withdraw');
      fetchPapers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setWithdrawing(null);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">My Papers</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading ? <div>Loading papers...</div> : (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="p-2 text-left">Title</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">File</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {papers.map(paper => (
              <tr key={paper.id} className="border-t">
                <td className="p-2">{paper.title}</td>
                <td className="p-2">{paper.status}</td>
                <td className="p-2">
                  <a href={paper.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download</a>
                </td>
                <td className="p-2">
                  {paper.status === 'submitted' && (
                    <button className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded" onClick={() => handleWithdraw(paper.id)} disabled={withdrawing === paper.id}>
                      Withdraw
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 