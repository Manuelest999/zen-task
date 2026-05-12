import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Target, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE, apiCall } from '../utils';
import Modal      from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';

const BLANK_GOAL = { title: '', target_value: 100, unit: '' };

const Goals = () => {
  const [goals, setGoals]             = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [form, setForm]               = useState(BLANK_GOAL);

  const fetchGoals = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/goals/`);
      setGoals(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchGoals(); }, []);

  const openCreate = () => { setForm(BLANK_GOAL); setEditingGoal(null); setIsModalOpen(true); };
  const openEdit   = (goal) => { setForm({ title: goal.title, target_value: goal.target_value, unit: goal.unit }); setEditingGoal(goal); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingGoal(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      if (editingGoal) {
        await apiCall('PATCH', `/goals/${editingGoal.id}/`, form);
      } else {
        await apiCall('POST', '/goals/', form);
      }
      closeModal();
      fetchGoals();
    } catch (e) { console.error(e); }
  };

  const deleteGoal = async (id) => {
    try { await apiCall('DELETE', `/goals/${id}/`); fetchGoals(); }
    catch (e) { console.error(e); }
  };

  const updateProgress = async (goal, inc) => {
    try {
      await apiCall('PATCH', `/goals/${goal.id}/`, {
        current_value: Math.max(0, goal.current_value + inc),
      });
      fetchGoals();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="page-container" style={{ gap: 'var(--space-6)' }}>

      <PageHeader
        title="Mis Metas"
        action={
          <button onClick={openCreate} className="btn btn-warning">
            <Plus size={18} /> Nueva Meta
          </button>
        }
      />

      <div className="grid-cards">
        <AnimatePresence>
          {goals.map(goal => {
            const pct = Math.min((goal.current_value / goal.target_value) * 100, 100);
            return (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="card card-accent-warning"
              >
                {/* Icon row */}
                <div className="flex-between mb-4">
                  <Target size={28} color="var(--color-warning)" />
                  <div className="flex-start gap-2">
                    <button onClick={() => openEdit(goal)} className="btn-icon btn-icon-sm" title="Editar">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => deleteGoal(goal.id)} className="btn-icon btn-icon-sm btn-icon-danger" title="Eliminar">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 style={{ fontWeight: 'var(--weight-extrabold)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-3)' }}>
                  {goal.title}
                </h3>

                {/* Progress */}
                <div className="progress-bar mb-4">
                  <motion.div
                    className="progress-fill"
                    style={{ background: 'var(--gradient-coral)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>

                <p className="text-muted text-xs mb-4" style={{ fontWeight: 'var(--weight-bold)' }}>
                  {goal.current_value} / {goal.target_value} {goal.unit} &nbsp;·&nbsp; {pct.toFixed(0)}%
                </p>

                {/* Controls */}
                <div className="flex-start gap-3">
                  <button
                    onClick={() => updateProgress(goal, 1)}
                    className="btn btn-warning"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    +1 {goal.unit}
                  </button>
                  <button
                    onClick={() => updateProgress(goal, -1)}
                    className="btn-icon btn-icon-sm"
                    title="Restar 1"
                    style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)' }}
                  >
                    −1
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modal crear / editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingGoal ? 'Editar Meta' : 'Nueva Meta'}
        maxWidth="480px"
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">¿Qué quieres lograr?</label>
            <input
              autoFocus
              placeholder="Título de la meta..."
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Objetivo numérico</label>
              <input
                type="number"
                placeholder="100"
                value={form.target_value}
                onChange={e => setForm({ ...form, target_value: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Unidad</label>
              <input
                placeholder="Libros, Km, Días..."
                value={form.unit}
                onChange={e => setForm({ ...form, unit: e.target.value })}
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-warning w-full"
            style={{ justifyContent: 'center', padding: 'var(--space-4)' }}
          >
            {editingGoal ? 'Guardar Cambios' : 'Empezar Meta'}
          </button>
        </form>
      </Modal>

    </div>
  );
};

export default Goals;
