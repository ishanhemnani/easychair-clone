'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Paper {
  id: string;
  title: string;
  authors: string;
  assigned_reviewers: Reviewer[];
}
interface Reviewer {
  id: string;
  name: string;
  email: string;
}

export default function AssignReviewersPage() {
  const { token } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [papersRes, reviewersRes] = await Promise.all([
        fetch(`${API_BASE}/papers`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/auth/reviewers`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const papersData = await papersRes.json();
      const reviewersData = await reviewersRes.json();
      setPapers(papersData.papers || []);
      setReviewers(reviewersData.reviewers || []);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssign = async (paperId: string, reviewerId: string) => {
    setAssigning(`${paperId}-${reviewerId}`);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/reviews/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ paper_id: paperId, reviewer_id: reviewerId }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to assign reviewer');
      }
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAssigning(null);
    }
  };

  const handleUnassign = async (paperId: string, reviewerId: string) => {
    setAssigning(`${paperId}-unassign-${reviewerId}`);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/reviews/assign`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ paper_id: paperId, reviewer_id: reviewerId }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to unassign reviewer');
      }
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Assign Reviewers</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading ? (
        <div>Loading papers and reviewers...</div>
      ) : (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="p-2 text-left">Paper Title</th>
              <th className="p-2 text-left">Authors</th>
              <th className="p-2 text-left">Assigned Reviewers</th>
              <th className="p-2 text-left">Assign Reviewer</th>
            </tr>
          </thead>
          <tbody>
            {papers.map(paper => (
              <tr key={paper.id} className="border-t">
                <td className="p-2">{paper.title}</td>
                <td className="p-2">{paper.authors}</td>
                <td className="p-2">
                  {paper.assigned_reviewers?.length ? (
                    <ul>
                      {paper.assigned_reviewers.map(r => (
                        <li key={r.id} className="flex items-center gap-2">
                          {r.name} ({r.email})
                          <button
                            className="text-xs bg-red-200 px-2 py-1 rounded"
                            disabled={assigning === `${paper.id}-unassign-${r.id}`}
                            onClick={() => handleUnassign(paper.id, r.id)}
                          >
                            Unassign
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : <span className="text-gray-500">None</span>}
                </td>
                <td className="p-2">
                  <select
                    className="border rounded px-2 py-1"
                    defaultValue=""
                    onChange={e => {
                      if (e.target.value) handleAssign(paper.id, e.target.value);
                    }}
                  >
                    <option value="">Select reviewer</option>
                    {reviewers.filter(r => !paper.assigned_reviewers?.some(ar => ar.id === r.id)).map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.email})</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 