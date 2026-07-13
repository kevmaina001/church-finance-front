import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChurch, FaLayerGroup } from 'react-icons/fa';
import API from '../utils/apiConfig';
import { lockedChurchId } from '../utils/permissions';

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
        const list = (res.data.localChurches || []).filter((c) => c.isActive);
        setChurches(list);
        // Church-scoped users can only work in their own church — lock them to it and skip the choice.
        const lockedId = lockedChurchId();
        if (lockedId) {
          const mine = list.find((c) => c._id === lockedId);
          localStorage.setItem('activeChurch', JSON.stringify({ id: lockedId, name: mine ? mine.name : 'My Church' }));
          navigate('/app/dashboard');
          return;
        }
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
    <div className="min-h-screen bg-[#f6f8fb] flex items-center justify-center p-4">
      <div className="app-surface rounded-2xl w-full max-w-4xl p-6 sm:p-8">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-teal-700">{parishName}</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 mt-1">Choose where to work</h1>
          <p className="text-sm text-slate-600 mt-3 mb-6">
            Select a local church to work on its book, or choose the whole parish for a consolidated view.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-slate-500 py-10">Loading churches...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => choose(PARISH_CONTEXT)}
              className="flex items-center gap-4 p-5 rounded-2xl border border-slate-200 bg-slate-950 text-white hover:shadow-lg transition text-left sm:col-span-2"
            >
              <FaLayerGroup className="text-3xl text-teal-200 flex-shrink-0" />
              <div>
                <div className="font-bold">Whole Parish</div>
                <div className="text-sm text-slate-300">See and manage all local churches combined.</div>
              </div>
            </button>

            {churches.map((c) => (
              <button
                key={c._id}
                onClick={() => choose({ id: c._id, name: c.name })}
                className="flex items-center gap-4 p-5 rounded-2xl border border-slate-200 bg-white hover:border-teal-300 hover:shadow-md transition text-left"
              >
                <FaChurch className="text-3xl text-teal-700 flex-shrink-0" />
                <div>
                  <div className="font-bold text-slate-950">{c.name}</div>
                  <div className="text-sm text-slate-500">Work on this church's book only.</div>
                </div>
              </button>
            ))}

            {churches.length === 0 && (
              <div className="sm:col-span-2 text-center text-slate-500 text-sm">
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
