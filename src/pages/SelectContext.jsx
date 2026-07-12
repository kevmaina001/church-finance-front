import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChurch, FaLayerGroup } from 'react-icons/fa';
import API from '../utils/apiConfig';

// The "active context" decides whether the app shows one local church's book
// or the whole parish (consolidated). Stored in localStorage as { id, name }
// where id === 'parish' means the consolidated parish view.
export const PARISH_CONTEXT = { id: 'parish', name: 'Whole Parish (Consolidated)' };

const SelectContext = () => {
  const [churches, setChurches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
  const parishName = tenant?.name || 'Parish';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    (async () => {
      try {
        const res = await API.get('/api/local-churches', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChurches((res.data.localChurches || []).filter((c) => c.isActive));
      } catch (err) {
        console.error('Error fetching local churches:', err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const choose = (context) => {
    localStorage.setItem('activeChurch', JSON.stringify(context));
    navigate('/app/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center">Choose where to work</h1>
        <p className="text-center text-gray-500 mt-2 mb-6">
          {parishName} &mdash; select a local church to work on its book, or the whole parish for the consolidated view.
        </p>

        {loading ? (
          <p className="text-center text-gray-500 py-10">Loading churches...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Parish (consolidated) */}
            <button
              onClick={() => choose(PARISH_CONTEXT)}
              className="flex items-center gap-4 p-5 rounded-xl border-2 border-indigo-200 bg-indigo-50 hover:border-indigo-500 hover:shadow-md transition text-left sm:col-span-2"
            >
              <FaLayerGroup className="text-3xl text-indigo-600 flex-shrink-0" />
              <div>
                <div className="font-semibold text-gray-800">Whole Parish (Consolidated)</div>
                <div className="text-sm text-gray-500">See and manage all local churches combined.</div>
              </div>
            </button>

            {/* Each local church */}
            {churches.map((c) => (
              <button
                key={c._id}
                onClick={() => choose({ id: c._id, name: c.name })}
                className="flex items-center gap-4 p-5 rounded-xl border-2 border-gray-200 bg-white hover:border-teal-500 hover:shadow-md transition text-left"
              >
                <FaChurch className="text-3xl text-teal-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-800">{c.name}</div>
                  <div className="text-sm text-gray-500">Work on this church's book only.</div>
                </div>
              </button>
            ))}

            {churches.length === 0 && (
              <div className="sm:col-span-2 text-center text-gray-500 text-sm">
                No local churches yet. You can still work at the parish level, or add churches under
                <span className="font-medium"> Local Churches</span>.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectContext;
