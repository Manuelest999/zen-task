import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Clock, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE, DAYS, formatTime12h, apiCall } from '../utils';
import Modal      from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';

const BLANK_ROUTINE = { title: '', time: '08:00' };

const Routines = () => {
  const [routines, setRoutines]         = useState([]);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [form, setForm]                 = useState(BLANK_ROUTINE);

  const fetchRoutines = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/routines/`);
      setRoutines(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchRoutines(); }, []);

  // Abrir modal de creación
  const openCreate = () => {
    setForm(BLANK_ROUTINE);
    setSelectedDays([]);
    setEditingRoutine(null);
    setIsModalOpen(true);
  };

  // Abrir modal de edición pre-rellenado
  const openEdit = (routine) => {
    setForm({ title: routine.title, time: routine.time });
    setSelectedDays(routine.days_of_week ? routine.days_of_week.split(',').filter(Boolean) : []);
    setEditingRoutine(routine);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingRoutine(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || selectedDays.length === 0) return;
    const payload = { ...form, days_of_week: selectedDays.join(',') };
    try {
      if (editingRoutine) {
        await apiCall('PATCH', `/routines/${editingRoutine.id}/`, payload);
      } else {
        await apiCall('POST', '/routines/', payload);
      }
      closeModal();
      fetchRoutines();
    } catch (e) { console.error(e); }
  };

  const deleteRoutine = async (id) => {
    try { await apiCall('DELETE', `/routines/${id}/`); fetchRoutines(); }
    catch (e) { console.error(e); }
  };

  const toggleDay = (id) =>
    setSelectedDays(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );

  return (
    <div className="page-container" style={{ gap: 'var(--space-6)' }}>

      <PageHeader
        title="Mis Rutinas"
        action={
          <button onClick={openCreate} className="btn btn-success">
            <Plus size={18} /> Nueva Rutina
          </button>
        }
      />

      <div className="grid-cards-wide">
        <AnimatePresence>
          {routines.map(routine => (
            <motion.div
              key={routine.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, y: -8 }}
              transition={{ duration: 0.25 }}
              className="card card-accent-success"
            >
              {/* Header */}
              <div className="flex-between mb-4">
                <div>
                  <h3 style={{ fontWeight: 'var(--weight-extrabold)', fontSize: 'var(--text-lg)' }}>
                    {routine.title}
                  </h3>
                  <span className="flex-start gap-2 text-muted text-sm" style={{ marginTop: 'var(--space-1)', fontWeight: 'var(--weight-medium)' }}>
                    <Clock size={14} /> {formatTime12h(routine.time)}
                  </span>
                </div>
                <div className="flex-start gap-2">
                  <button
                    onClick={() => openEdit(routine)}
                    className="btn-icon btn-icon-sm"
                    title="Editar rutina"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => deleteRoutine(routine.id)}
                    className="btn-icon btn-icon-sm btn-icon-danger"
                    title="Eliminar rutina"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Day track */}
              <div className="day-track">
                {DAYS.map(day => (
                  <div key={day.id} className="day-track-item">
                    <div className={`day-track-bar ${routine.days_of_week?.includes(day.id) ? 'active' : 'inactive'}`} />
                    <span className="day-track-label">{day.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal crear / editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingRoutine ? 'Editar Rutina' : 'Nueva Rutina'}
        maxWidth="480px"
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Nombre del hábito</label>
            <input
              autoFocus
              placeholder="Meditación, Ejercicio..."
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Días de la semana</label>
            <div className="day-pills">
              {DAYS.map(day => (
                <button
                  key={day.id}
                  type="button"
                  className={`day-pill ${selectedDays.includes(day.id) ? 'active' : ''}`}
                  onClick={() => toggleDay(day.id)}
                  title={day.full}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Hora</label>
            <input
              type="time"
              value={form.time}
              onChange={e => setForm({ ...form, time: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="btn btn-success w-full"
            style={{ justifyContent: 'center', padding: 'var(--space-4)' }}
          >
            {editingRoutine ? 'Guardar Cambios' : 'Crear Rutina'}
          </button>
        </form>
      </Modal>

    </div>
  );
};

export default Routines;
