'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Paper {
  id: string;
  title: string;
  abstract: string;
  file_url: string;
  review_id: string;
  review_status: string;
}

export default function SubmitReviewPage() {
  const { token } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<{ [reviewId: string]: { score: string; comments: string } }>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

  const fetchPapers = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/reviews/assigned`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setPapers((data.papers || []).filter((p: Paper) => p.review_status === 'pending'));
    } catch (err) {
      setError('Failed to fetch assigned papers');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchPapers(); }, []);

  const handleChange = (reviewId: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [reviewId]: { ...f[reviewId], [name]: value } }));
  };

  const handleSubmit = async (paper: Paper, reviewId: string) => {
    setSubmitting(reviewId); setError(null); setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/reviews/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          paper_id: paper.id,
          review_id: reviewId,
          score: form[reviewId]?.score,
          comments: form[reviewId]?.comments,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to submit review');
      setSuccess('Review submitted!');
      setForm(f => ({ ...f, [reviewId]: { score: '', comments: '' } }));
      fetchPapers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Submit Review</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      {loading ? <div>Loading assigned papers...</div> : (
        papers.length === 0 ? <div>No pending reviews.</div> : (
          <div className="space-y-8">
            {papers.map(paper => (
              <div key={paper.id} className="bg-white p-4 rounded shadow">
                <h2 className="font-semibold text-lg mb-2">{paper.title}</h2>
                <div className="mb-2 text-gray-700">{paper.abstract}</div>
                <a href={paper.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline mb-2 block">Download Paper</a>
                <form onSubmit={e => { e.preventDefault(); handleSubmit(paper, paper.review_id); }} className="space-y-2">
                  <input
                    className="w-full border px-2 py-1 rounded"
                    name="score"
                    type="number"
                    min="1"
                    max="10"
                    placeholder="Score (1-10)"
                    value={form[paper.review_id]?.score || ''}
                    onChange={e => handleChange(paper.review_id, e)}
                    required
                  />
                  <textarea
                    className="w-full border px-2 py-1 rounded"
                    name="comments"
                    placeholder="Comments"
                    value={form[paper.review_id]?.comments || ''}
                    onChange={e => handleChange(paper.review_id, e)}
                    required
                  />
                  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded" disabled={submitting === paper.review_id}>
                    {submitting === paper.review_id ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
} 