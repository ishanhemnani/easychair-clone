'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Review {
  id: string;
  paper_title: string;
  reviewer: string;
  score: number;
  comments: string;
  rebuttal_allowed: boolean;
  rebuttal?: string;
}

export default function ViewReviewsPage() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rebuttal, setRebuttal] = useState<{ [reviewId: string]: string }>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

  const fetchReviews = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/reviews/my-papers`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (err) {
      setError('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchReviews(); }, []);

  const handleRebuttal = async (reviewId: string) => {
    setSubmitting(reviewId); setError(null);
    try {
      const res = await fetch(`${API_BASE}/rebuttals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ review_id: reviewId, content: rebuttal[reviewId] }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to submit rebuttal');
      fetchReviews();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">View Reviews</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading ? <div>Loading reviews...</div> : (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="p-2 text-left">Paper</th>
              <th className="p-2 text-left">Reviewer</th>
              <th className="p-2 text-left">Score</th>
              <th className="p-2 text-left">Comments</th>
              <th className="p-2 text-left">Rebuttal</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r.id} className="border-t align-top">
                <td className="p-2">{r.paper_title}</td>
                <td className="p-2">{r.reviewer}</td>
                <td className="p-2">{r.score}</td>
                <td className="p-2 whitespace-pre-line">{r.comments}</td>
                <td className="p-2">
                  {r.rebuttal_allowed ? (
                    <div>
                      <textarea
                        className="w-full border px-2 py-1 rounded mb-2"
                        placeholder="Write rebuttal..."
                        value={rebuttal[r.id] || ''}
                        onChange={e => setRebuttal(rb => ({ ...rb, [r.id]: e.target.value }))}
                        disabled={!!r.rebuttal}
                      />
                      <button
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                        onClick={() => handleRebuttal(r.id)}
                        disabled={submitting === r.id || !!r.rebuttal || !(rebuttal[r.id] || '').trim()}
                      >
                        {submitting === r.id ? 'Submitting...' : r.rebuttal ? 'Submitted' : 'Submit'}
                      </button>
                    </div>
                  ) : r.rebuttal ? (
                    <span className="text-gray-700">{r.rebuttal}</span>
                  ) : (
                    <span className="text-gray-400">Not allowed</span>
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