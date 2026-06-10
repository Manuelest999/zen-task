import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus, Trash2, CheckCircle2, Edit2, Calendar as CalendarIcon,
  Clock, AlertCircle, Filter, AlignLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE, formatTime12h, formatDate, apiCall } from '../utils';
import Modal      from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import Badge      from '../components/ui/Badge';

const BLANK_TASK = { title: '', description: '', date: '', time: '08:00', priority: 'MEDIUM' };
const FILTER_OPTIONS = [
  { id: 'all',       label: 'Todas' },
  { id: 'pending',   label: 'Pendientes' },
  { id: 'completed', label: 'Completadas' },
];

const isOverdue = (task) => {
  if (!task.due_date || task.is_completed) return false;
  return task.due_date < new Date().toISOString();
};

const Tasks = () => {
  const [tasks, setTasks]             = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm]               = useState(BLANK_TASK);
  const [filter, setFilter]           = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // id de tarea a eliminar

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
    setForm({
      title: task.title,
      description: task.description || '',
      date: dateStr,
      time: timeStr || '08:00',
      priority: task.priority,
    });
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingTask(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const payload = {
      title:       form.title,
      description: form.description,
      due_date:    form.date ? `${form.date}T${form.time}:00` : null,
      priority:    form.priority,
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

  // Eliminar con confirmación
  const requestDelete = (id) => setDeleteConfirm(id);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await apiCall('DELETE', `/tasks/${deleteConfirm}/`);
      fetchTasks();
    } catch (e) { console.error(e); }
    setDeleteConfirm(null);
  };

  const accentColor = (task) => {
    if (task.is_completed) return 'card-accent-success';
    if (isOverdue(task) || task.priority === 'HIGH') return 'card-accent-danger';
    return 'card-accent-primary';
  };

  // Filtrar tareas según el filtro activo
  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending')   return !t.is_completed;
    if (filter === 'completed') return t.is_completed;
    return true;
  });

  // Contadores
  const pendingCount   = tasks.filter(t => !t.is_completed).length;
  const completedCount = tasks.filter(t => t.is_completed).length;

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

      {/* Estadísticas rápidas */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div className="card" style={{ padding: 'var(--space-4) var(--space-6)', flex: 1, minWidth: 120, textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-black)', color: 'var(--color-primary-light)', margin: 0 }}>{pendingCount}</p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 'var(--weight-bold)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pendientes</p>
        </div>
        <div className="card" style={{ padding: 'var(--space-4) var(--space-6)', flex: 1, minWidth: 120, textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-black)', color: 'var(--color-success)', margin: 0 }}>{completedCount}</p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 'var(--weight-bold)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Completadas</p>
        </div>
        <div className="card" style={{ padding: 'var(--space-4) var(--space-6)', flex: 1, minWidth: 120, textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-black)', color: 'var(--fg)', margin: 0 }}>{tasks.length}</p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 'var(--weight-bold)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</p>
        </div>
      </div>

      {/* Tabs de filtro */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
        <Filter size={15} style={{ color: 'var(--muted)', flexShrink: 0 }} />
        <div style={{ display: 'flex', gap: 'var(--space-2)', background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: 'var(--space-1)', border: '1px solid var(--border)' }}>
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              style={{
                padding: '0.35rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-bold)',
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                transition: 'all var(--duration-fast) var(--ease-out)',
                background: filter === opt.id ? 'var(--gradient-primary)' : 'transparent',
                color: filter === opt.id ? 'white' : 'var(--muted)',
                boxShadow: filter === opt.id ? 'var(--shadow-primary)' : 'none',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de tareas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <AnimatePresence>
          {filteredTasks.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card"
              style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--muted)' }}
            >
              <CheckCircle2 size={40} style={{ margin: '0 auto var(--space-3)' }} />
              <p style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>
                {filter === 'completed' ? '¡Ninguna tarea completada aún!' :
                 filter === 'pending'   ? '¡Sin tareas pendientes! 🎉' :
                 '¡Crea tu primera tarea!'}
              </p>
            </motion.div>
          )}
          {filteredTasks.map(task => {
            const overdue = isOverdue(task);
            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`card ${accentColor(task)}`}
                style={{ padding: 'var(--space-4) var(--space-6)' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                  {/* Left: check + info */}
                  <div className="flex-start gap-4" style={{ alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                    <button
                      onClick={() => toggleTask(task)}
                      className="btn-icon"
                      style={{ backgroundColor: task.is_completed ? 'var(--color-success-ghost)' : undefined, flexShrink: 0, marginTop: 2 }}
                      title={task.is_completed ? 'Desmarcar' : 'Completar'}
                    >
                      <CheckCircle2 size={22} color={task.is_completed ? 'var(--color-success)' : 'var(--muted)'} />
                    </button>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{
                        fontWeight: 'var(--weight-bold)',
                        textDecoration: task.is_completed ? 'line-through' : 'none',
                        opacity: task.is_completed ? 0.5 : 1,
                        fontSize: 'var(--text-base)',
                        marginBottom: task.description ? 'var(--space-1)' : 0,
                      }}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p style={{
                          fontSize: 'var(--text-xs)', color: 'var(--muted)',
                          fontWeight: 'var(--weight-medium)', margin: 0,
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          opacity: task.is_completed ? 0.4 : 0.8,
                        }}>
                          <AlignLeft size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                          {task.description}
                        </p>
                      )}
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
                  <div className="flex-start gap-2" style={{ flexShrink: 0 }}>
                    <button
                      onClick={() => openEdit(task)}
                      className="btn-icon btn-icon-sm"
                      title="Editar tarea"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => requestDelete(task.id)}
                      className="btn-icon btn-icon-sm btn-icon-danger"
                      title="Eliminar tarea"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
          <div className="form-group">
            <label className="form-label">Descripción (opcional)</label>
            <textarea
              placeholder="Agrega detalles o notas..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              style={{ resize: 'vertical' }}
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

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Eliminar Tarea"
        maxWidth="400px"
      >
        <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
          ¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.
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

export default Tasks;
