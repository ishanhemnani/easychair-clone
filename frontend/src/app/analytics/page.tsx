'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsData {
  total_submissions: number;
  total_reviews: number;
  acceptance_rate: number;
  reviewer_activity: { reviewer: string; reviews: number }[];
}

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/analytics`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const result = await res.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Analytics</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading ? (
        <div>Loading analytics...</div>
      ) : data ? (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold">Total Submissions</h2>
            <div>{data.total_submissions}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold">Total Reviews</h2>
            <div>{data.total_reviews}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold">Acceptance Rate</h2>
            <div>{data.acceptance_rate}%</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold">Reviewer Activity</h2>
            <ul>
              {data.reviewer_activity.map((ra, i) => (
                <li key={i}>{ra.reviewer}: {ra.reviews} reviews</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
} 