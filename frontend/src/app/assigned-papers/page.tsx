'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Paper {
  id: string;
  title: string;
  abstract: string;
  file_url: string;
  review_status: string;
}

export default function AssignedPapersPage() {
  const { token } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

  const fetchPapers = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/reviews/assigned`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setPapers(data.papers || []);
    } catch (err) {
      setError('Failed to fetch assigned papers');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchPapers(); }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Assigned Papers</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading ? <div>Loading assigned papers...</div> : (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="p-2 text-left">Title</th>
              <th className="p-2 text-left">Abstract</th>
              <th className="p-2 text-left">File</th>
              <th className="p-2 text-left">Review Status</th>
            </tr>
          </thead>
          <tbody>
            {papers.map(paper => (
              <tr key={paper.id} className="border-t">
                <td className="p-2">{paper.title}</td>
                <td className="p-2">{paper.abstract}</td>
                <td className="p-2">
                  <a href={paper.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download</a>
                </td>
                <td className="p-2">{paper.review_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 