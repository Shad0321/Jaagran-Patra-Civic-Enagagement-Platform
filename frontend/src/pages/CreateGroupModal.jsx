import React, { useState } from 'react';
import api from '../utils/api';

const GROUP_TYPES = [
  { value: 'PUBLIC_MLA_GROUP', label: 'Public MLA Group (Anyone can join)' },
  { value: 'PRIVATE_MLA_GROUP', label: 'MLA & Members Only' },
];

const CreateGroupModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState(GROUP_TYPES[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/chat/groups', { name, description, type });
      setSuccess('Group created successfully!');
      setName('');
      setDescription('');
      setType(GROUP_TYPES[0].value);
      if (onCreated) onCreated(res.data.data);
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1000);
    } catch (err) {
      setError(
        err?.response?.data?.message || 'Failed to create group. Only MLAs can create groups.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-lg font-bold mb-4">Create New Chat Group</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Group Name</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Group Type</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {GROUP_TYPES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded border"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50"
              disabled={loading || !name.trim()}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
