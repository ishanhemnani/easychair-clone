'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Conference {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  submission_deadline: string;
  status: string;
}

export default function ManageConferencesPage() {
  const { token } = useAuth();
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    submission_deadline: '',
    status: 'draft',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

  const fetchConferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/conferences`);
      const data = await res.json();
      setConferences(data.conferences || []);
    } catch (err) {
      setError('Failed to fetch conferences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConferences();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_BASE}/conferences/${editingId}` : `${API_BASE}/conferences`;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save conference');
      }
      setShowForm(false);
      setForm({ title: '', description: '', start_date: '', end_date: '', submission_deadline: '', status: 'draft' });
      setEditingId(null);
      fetchConferences();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (conf: Conference) => {
    setForm({
      title: conf.title,
      description: conf.description,
      start_date: conf.start_date?.slice(0, 10) || '',
      end_date: conf.end_date?.slice(0, 10) || '',
      submission_deadline: conf.submission_deadline?.slice(0, 10) || '',
      status: conf.status || 'draft',
    });
    setEditingId(conf.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this conference?')) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/conferences/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete conference');
      }
      fetchConferences();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Manage Conferences</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <button
        className="mb-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
        onClick={() => {
          setShowForm(true);
          setEditingId(null);
          setForm({ title: '', description: '', start_date: '', end_date: '', submission_deadline: '', status: 'draft' });
        }}
      >
        + Create Conference
      </button>
      {showForm && (
        <form className="mb-6 space-y-4 bg-white p-4 rounded shadow" onSubmit={handleCreateOrUpdate}>
          <input
            className="w-full border px-2 py-1 rounded"
            name="title"
            placeholder="Title"
            value={form.title}
            onChange={handleInputChange}
            required
          />
          <textarea
            className="w-full border px-2 py-1 rounded"
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleInputChange}
          />
          <input
            className="w-full border px-2 py-1 rounded"
            name="start_date"
            type="date"
            value={form.start_date}
            onChange={handleInputChange}
            required
          />
          <input
            className="w-full border px-2 py-1 rounded"
            name="end_date"
            type="date"
            value={form.end_date}
            onChange={handleInputChange}
            required
          />
          <input
            className="w-full border px-2 py-1 rounded"
            name="submission_deadline"
            type="date"
            value={form.submission_deadline}
            onChange={handleInputChange}
            required
          />
          <select
            className="w-full border px-2 py-1 rounded"
            name="status"
            value={form.status}
            onChange={handleInputChange}
            required
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
          <div className="flex gap-2">
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
              {editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={() => { setShowForm(false); setEditingId(null); }}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {loading ? (
        <div>Loading conferences...</div>
      ) : (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="p-2 text-left">Title</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-left">Start Date</th>
              <th className="p-2 text-left">End Date</th>
              <th className="p-2 text-left">Submission Deadline</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {conferences.map(conf => (
              <tr key={conf.id} className="border-t">
                <td className="p-2">{conf.title}</td>
                <td className="p-2">{conf.description}</td>
                <td className="p-2">{conf.start_date?.slice(0, 10)}</td>
                <td className="p-2">{conf.end_date?.slice(0, 10)}</td>
                <td className="p-2">{conf.submission_deadline?.slice(0, 10)}</td>
                <td className="p-2">{conf.status}</td>
                <td className="p-2 flex gap-2">
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded" onClick={() => handleEdit(conf)}>
                    Edit
                  </button>
                  <button className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded" onClick={() => handleDelete(conf.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 