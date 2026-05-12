import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, CheckCircle2, Edit2, Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE, formatTime12h, formatDate, apiCall } from '../utils';
import Modal      from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import Badge      from '../components/ui/Badge';

const BLANK_TASK = { title: '', date: '', time: '08:00', priority: 'MEDIUM' };

const isOverdue = (task) => {
  if (!task.due_date || task.is_completed) return false;
  return task.due_date < new Date().toISOString();
};

const Tasks = () => {
  const [tasks, setTasks]             = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm]               = useState(BLANK_TASK);

  const fetchTasks = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/tasks/`);
      setTasks(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchTasks(); }, []);

  // Abrir modal para crear
  const openCreate = () => {
    setForm(BLANK_TASK);
    setEditingTask(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar, rellenando el form con los datos actuales
  const openEdit = (task) => {
    const dateStr = task.due_date ? task.due_date.split('T')[0] : '';
    const timeStr = task.due_date ? task.due_date.split('T')[1]?.slice(0, 5) : '08:00';
    setForm({ title: task.title, date: dateStr, time: timeStr || '08:00', priority: task.priority });
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingTask(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const payload = {
      title:    form.title,
      due_date: form.date ? `${form.date}T${form.time}:00` : null,
      priority: form.priority,
    };
    try {
      if (editingTask) {
        await apiCall('PATCH', `/tasks/${editingTask.id}/`, payload);
      } else {
        await apiCall('POST', '/tasks/', payload);
      }
      closeModal();
      fetchTasks();
    } catch (e) { console.error(e); }
  };

  const toggleTask = async (task) => {
    try {
      await apiCall('PATCH', `/tasks/${task.id}/`, { is_completed: !task.is_completed });
      fetchTasks();
    } catch (e) { console.error(e); }
  };

  const deleteTask = async (id) => {
    try { await apiCall('DELETE', `/tasks/${id}/`); fetchTasks(); }
    catch (e) { console.error(e); }
  };

  const accentColor = (task) => {
    if (task.is_completed) return 'card-accent-success';
    if (isOverdue(task) || task.priority === 'HIGH') return 'card-accent-danger';
    return 'card-accent-primary';
  };

  return (
    <div className="page-container" style={{ gap: 'var(--space-6)' }}>

      <PageHeader
        title="Mis Tareas"
        action={
          <button onClick={openCreate} className="btn btn-primary">
            <Plus size={18} /> Nueva Tarea
          </button>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <AnimatePresence>
          {tasks.map(task => {
            const overdue = isOverdue(task);
            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`card ${accentColor(task)}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-6)' }}
              >
                {/* Left: check + info */}
                <div className="flex-start gap-4">
                  <button
                    onClick={() => toggleTask(task)}
                    className="btn-icon"
                    style={{ backgroundColor: task.is_completed ? 'var(--color-success-ghost)' : undefined }}
                    title={task.is_completed ? 'Desmarcar' : 'Completar'}
                  >
                    <CheckCircle2 size={22} color={task.is_completed ? 'var(--color-success)' : 'var(--muted)'} />
                  </button>
                  <div>
                    <h3 style={{
                      fontWeight: 'var(--weight-bold)',
                      textDecoration: task.is_completed ? 'line-through' : 'none',
                      opacity: task.is_completed ? 0.5 : 1,
                      fontSize: 'var(--text-base)',
                    }}>
                      {task.title}
                    </h3>
                    <div className="flex-start gap-3 mt-4" style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', flexWrap: 'wrap' }}>
                      <Badge priority={task.priority} />
                      {overdue && (
                        <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <AlertCircle size={10} /> VENCIDA
                        </span>
                      )}
                      {task.due_date && (
                        <>
                          <span className="flex-start gap-2"><CalendarIcon size={12} /> {formatDate(task.due_date)}</span>
                          <span className="flex-start gap-2"><Clock size={12} /> {formatTime12h(task.due_date)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: acciones */}
                <div className="flex-start gap-2">
                  <button
                    onClick={() => openEdit(task)}
                    className="btn-icon btn-icon-sm"
                    title="Editar tarea"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="btn-icon btn-icon-sm btn-icon-danger"
                    title="Eliminar tarea"
                  >
                    <Trash2 size={16} />
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
        title={editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">¿Qué hay que hacer?</label>
            <input
              autoFocus
              placeholder="Título de la tarea..."
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Hora</label>
              <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Prioridad</label>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary w-full" style={{ justifyContent: 'center', padding: 'var(--space-4)' }}>
            {editingTask ? 'Guardar Cambios' : 'Añadir Tarea'}
          </button>
        </form>
      </Modal>

    </div>
  );
};

export default Tasks;
