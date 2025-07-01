'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Conference {
  id: string;
  title: string;
  status: string;
  submission_deadline: string;
}

const PaperSubmissionForm: React.FC = () => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    conference_id: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetchConferences();
  }, []);

  const fetchConferences = async () => {
    try {
      const response = await fetch(`${API_BASE}/conferences`);
      if (response.ok) {
        const data = await response.json();
        setConferences(data.conferences.filter((conf: Conference) => conf.status === 'active'));
      }
    } catch (error) {
      console.error('Error fetching conferences:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (!['application/pdf', 'application/zip'].includes(selectedFile.type)) {
        setError('Only PDF and ZIP files are allowed');
        return;
      }

      // Validate file size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!file) {
      setError('Please select a file');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('abstract', formData.abstract);
      formDataToSend.append('conference_id', formData.conference_id);
      formDataToSend.append('paper', file);

      const response = await fetch(`${API_BASE}/papers/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Submission failed');
      }

      const data = await response.json();
      setSuccess(true);
      setFormData({ title: '', abstract: '', conference_id: '' });
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('paper-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Paper Submitted Successfully!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your paper has been submitted and is under review.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Submit Another Paper
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Submit Paper
            </h2>
            <p className="text-gray-600">
              Submit your research paper for review
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Paper Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="abstract" className="block text-sm font-medium text-gray-700">
                Abstract *
              </label>
              <textarea
                id="abstract"
                name="abstract"
                required
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.abstract}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="conference_id" className="block text-sm font-medium text-gray-700">
                Conference *
              </label>
              <select
                id="conference_id"
                name="conference_id"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.conference_id}
                onChange={handleInputChange}
              >
                <option value="">Select a conference</option>
                {conferences.map((conference) => (
                  <option key={conference.id} value={conference.id}>
                    {conference.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="paper-file" className="block text-sm font-medium text-gray-700">
                Paper File (PDF or ZIP) *
              </label>
              <input
                type="file"
                id="paper-file"
                accept=".pdf,.zip"
                onChange={handleFileChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">
                Maximum file size: 10MB. Accepted formats: PDF, ZIP
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Paper'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaperSubmissionForm; 