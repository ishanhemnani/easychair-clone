'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Review {
  id: string;
  paper_title: string;
  score: number;
  comments: string;
  submitted_at: string;
}

export default function ReviewHistoryPage() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

  const fetchReviews = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/reviews/history`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (err) {
      setError('Failed to fetch review history');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchReviews(); }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Review History</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading ? <div>Loading review history...</div> : (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="p-2 text-left">Paper</th>
              <th className="p-2 text-left">Score</th>
              <th className="p-2 text-left">Comments</th>
              <th className="p-2 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.paper_title}</td>
                <td className="p-2">{r.score}</td>
                <td className="p-2 whitespace-pre-line">{r.comments}</td>
                <td className="p-2">{r.submitted_at?.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 