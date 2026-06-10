import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Target, Edit2, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE, apiCall, formatDate } from '../utils';
import Modal      from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';

const BLANK_GOAL = { title: '', description: '', target_value: 100, unit: '', deadline: '' };

const Goals = () => {
  const [goals, setGoals]             = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [form, setForm]               = useState(BLANK_GOAL);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchGoals = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/goals/`);
      setGoals(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchGoals(); }, []);

  const openCreate = () => { setForm(BLANK_GOAL); setEditingGoal(null); setIsModalOpen(true); };
  const openEdit   = (goal) => {
    setForm({
      title:        goal.title,
      description:  goal.description || '',
      target_value: goal.target_value,
      unit:         goal.unit,
      deadline:     goal.deadline || '',
    });
    setEditingGoal(goal);
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setEditingGoal(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const payload = {
      title:        form.title,
      description:  form.description,
      target_value: Number(form.target_value),
      unit:         form.unit,
      deadline:     form.deadline || null,
    };
    try {
      if (editingGoal) {
        await apiCall('PATCH', `/goals/${editingGoal.id}/`, payload);
      } else {
        await apiCall('POST', '/goals/', payload);
      }
      closeModal();
      fetchGoals();
    } catch (e) { console.error(e); }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try { await apiCall('DELETE', `/goals/${deleteConfirm}/`); fetchGoals(); }
    catch (e) { console.error(e); }
    setDeleteConfirm(null);
  };

  const updateProgress = async (goal, inc) => {
    const newValue = Math.max(0, goal.current_value + inc);
    // No superar el target_value en el incremento
    const clampedValue = Math.min(newValue, goal.target_value + Math.abs(inc));
    try {
      await apiCall('PATCH', `/goals/${goal.id}/`, { current_value: clampedValue });
      fetchGoals();
    } catch (e) { console.error(e); }
  };

  // Estadísticas globales
  const achieved = goals.filter(g => g.current_value >= g.target_value).length;
  const inProgress = goals.filter(g => g.current_value > 0 && g.current_value < g.target_value).length;

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

      {/* Estadísticas rápidas */}
      {goals.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div className="card" style={{ padding: 'var(--space-4) var(--space-6)', flex: 1, minWidth: 120, textAlign: 'center' }}>
            <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-black)', color: 'var(--color-warning)', margin: 0 }}>{goals.length}</p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 'var(--weight-bold)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</p>
          </div>
          <div className="card" style={{ padding: 'var(--space-4) var(--space-6)', flex: 1, minWidth: 120, textAlign: 'center' }}>
            <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-black)', color: 'var(--color-primary-light)', margin: 0 }}>{inProgress}</p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 'var(--weight-bold)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>En Progreso</p>
          </div>
          <div className="card" style={{ padding: 'var(--space-4) var(--space-6)', flex: 1, minWidth: 120, textAlign: 'center' }}>
            <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-black)', color: 'var(--color-success)', margin: 0 }}>{achieved}</p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 'var(--weight-bold)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Logradas</p>
          </div>
        </div>
      )}

      <div className="grid-cards">
        <AnimatePresence>
          {goals.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card"
              style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--muted)', gridColumn: '1/-1' }}
            >
              <Target size={40} style={{ margin: '0 auto var(--space-3)' }} color="var(--color-warning)" />
              <p style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>
                ¡Define tu primera meta y empieza a progresar!
              </p>
            </motion.div>
          )}
          {goals.map(goal => {
            const pct = goal.target_value > 0
              ? Math.min((goal.current_value / goal.target_value) * 100, 100)
              : 0;
            const isAchieved = goal.current_value >= goal.target_value;

            return (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className={`card ${isAchieved ? 'card-accent-success' : 'card-accent-warning'}`}
              >
                {/* Icon row */}
                <div className="flex-between mb-4">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {isAchieved
                      ? <Trophy size={26} color="var(--color-success-light)" />
                      : <Target size={26} color="var(--color-warning)" />
                    }
                    {isAchieved && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                        className="badge badge-success"
                        style={{ fontSize: '0.65rem' }}
                      >
                        ✓ Meta Cumplida
                      </motion.span>
                    )}
                  </div>
                  <div className="flex-start gap-2">
                    <button onClick={() => openEdit(goal)} className="btn-icon btn-icon-sm" title="Editar">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => setDeleteConfirm(goal.id)} className="btn-icon btn-icon-sm btn-icon-danger" title="Eliminar">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Title + description */}
                <h3 style={{ fontWeight: 'var(--weight-extrabold)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-1)' }}>
                  {goal.title}
                </h3>
                {goal.description && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>
                    {goal.description}
                  </p>
                )}

                {/* Deadline */}
                {goal.deadline && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>
                    📅 Límite: {formatDate(goal.deadline)}
                  </p>
                )}

                {/* Progress */}
                <div className="progress-bar mb-4">
                  <motion.div
                    className="progress-fill"
                    style={{ background: isAchieved ? 'var(--gradient-teal)' : 'var(--gradient-coral)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>

                <p className="text-muted text-xs mb-4" style={{ fontWeight: 'var(--weight-bold)' }}>
                  {goal.current_value} / {goal.target_value} {goal.unit} &nbsp;·&nbsp; {pct.toFixed(0)}%
                </p>

                {/* Controls — ocultar si ya se logró */}
                {!isAchieved && (
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
                      disabled={goal.current_value <= 0}
                      style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', opacity: goal.current_value <= 0 ? 0.4 : 1 }}
                    >
                      −1
                    </button>
                  </div>
                )}

                {isAchieved && (
                  <div style={{
                    textAlign: 'center', padding: 'var(--space-3)',
                    background: 'var(--color-success-ghost)',
                    borderRadius: 'var(--radius)',
                    fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)',
                    color: 'var(--color-success-light)',
                  }}>
                    🎉 ¡Felicitaciones! Meta alcanzada
                  </div>
                )}
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
          <div className="form-group">
            <label className="form-label">Descripción (opcional)</label>
            <textarea
              placeholder="¿Por qué es importante esta meta?"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Objetivo numérico</label>
              <input
                type="number"
                placeholder="100"
                min="1"
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
          <div className="form-group">
            <label className="form-label">Fecha límite (opcional)</label>
            <input
              type="date"
              value={form.deadline}
              onChange={e => setForm({ ...form, deadline: e.target.value })}
            />
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

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Eliminar Meta"
        maxWidth="400px"
      >
        <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
          ¿Seguro que quieres eliminar esta meta? Se perderá todo el progreso registrado.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            onClick={() => setDeleteConfirm(null)}
            className="btn btn-ghost w-full"
            style={{ justifyContent: 'center', padding: 'var(--space-4)' }}
          >
            Cancelar
          </button>
          <button
            onClick={confirmDelete}
            className="btn w-full"
            style={{
              justifyContent: 'center', padding: 'var(--space-4)',
              background: 'var(--color-danger)', color: 'white',
              boxShadow: '0 4px 20px rgba(225,29,72,0.35)',
            }}
          >
            Eliminar
          </button>
        </div>
      </Modal>

    </div>
  );
};

export default Goals;
