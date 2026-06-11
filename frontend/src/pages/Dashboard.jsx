import React, { useState, useEffect } from 'react';
import {
  CheckSquare, Repeat, Target, Plus, Clock,
  CheckCircle2, X, Layout as DashboardIcon, AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime12h, formatDate, DAYS, todayISO, apiCall } from '../utils';
import { Trophy } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';

// ── Helpers ────────────────────────────────────────────────────────────────────
const isOverdue = (task) => {
  if (!task.due_date || task.is_completed) return false;
  // Compara la fecha/hora de vencimiento con ahora (string ISO directo, sin Date TZ issues)
  return task.due_date < new Date().toISOString();
};

const sortByDueDate = (tasks) =>
  [...tasks].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;   // sin fecha van al final
    if (!b.due_date) return -1;
    return a.due_date.localeCompare(b.due_date);
  });

// ── Quick-add forms ─────────────────────────────────────────────────────────────
const DAYS_LIST = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const TaskQuickForm = ({ formData, setFormData, onSubmit }) => (
  <motion.form
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: 'auto', opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    transition={{ duration: 0.2 }}
    onSubmit={onSubmit}
    className="card card-accent-primary"
    style={{ marginBottom: 'var(--space-6)', overflow: 'hidden', borderColor: 'var(--color-primary)' }}
  >
    <input
      autoFocus
      placeholder="¿Qué necesitas hacer?"
      value={formData.title}
      onChange={e => setFormData({ ...formData, title: e.target.value })}
      style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--text-lg)', background: 'transparent', fontWeight: 'var(--weight-bold)' }}
    />
    <div className="form-grid" style={{ marginBottom: 'var(--space-4)' }}>
      <div className="form-group">
        <label className="form-label">Fecha</label>
        <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">Hora</label>
        <input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">Prioridad</label>
        <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
          <option value="LOW">Baja</option>
          <option value="MEDIUM">Media</option>
          <option value="HIGH">Alta</option>
        </select>
      </div>
    </div>
    <button type="submit" className="btn btn-primary w-full" style={{ justifyContent: 'center', padding: 'var(--space-4)' }}>
      Añadir Tarea
    </button>
  </motion.form>
);

const RoutineQuickForm = ({ formData, setFormData, selectedDays, setSelectedDays, onSubmit }) => (
  <motion.form
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: 'auto', opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    transition={{ duration: 0.2 }}
    onSubmit={onSubmit}
    className="card"
    style={{ marginBottom: 'var(--space-6)', overflow: 'hidden', borderColor: 'var(--color-success)', borderWidth: '2px' }}
  >
    <input
      placeholder="Nombre de la rutina..."
      value={formData.title}
      onChange={e => setFormData({ ...formData, title: e.target.value })}
      style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--text-lg)', background: 'transparent', fontWeight: 'var(--weight-bold)' }}
    />
    <div className="day-pills" style={{ marginBottom: 'var(--space-6)' }}>
      {DAYS.map(day => (
        <button key={day.id} type="button"
          className={`day-pill ${selectedDays.includes(day.id) ? 'active' : ''}`}
          onClick={() => setSelectedDays(prev =>
            prev.includes(day.id) ? prev.filter(d => d !== day.id) : [...prev, day.id]
          )}
        >{day.label}</button>
      ))}
    </div>
    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
      <input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} style={{ flex: 1 }} />
      <button type="submit" className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}>Crear Rutina</button>
    </div>
  </motion.form>
);

const GoalQuickForm = ({ formData, setFormData, onSubmit }) => (
  <motion.form
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: 'auto', opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    transition={{ duration: 0.2 }}
    onSubmit={onSubmit}
    className="card"
    style={{ marginBottom: 'var(--space-6)', overflow: 'hidden', borderColor: 'var(--color-warning)', borderWidth: '2px' }}
  >
    <input
      autoFocus
      placeholder="¿Qué quieres lograr?"
      value={formData.title}
      onChange={e => setFormData({ ...formData, title: e.target.value })}
      style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--text-lg)', background: 'transparent', fontWeight: 'var(--weight-bold)' }}
    />
    <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
      <div className="form-group" style={{ flex: 1 }}>
        <label className="form-label">Objetivo numérico</label>
        <input type="number" value={formData.target} onChange={e => setFormData({ ...formData, target: e.target.value })} />
      </div>
      <div className="form-group" style={{ flex: 1 }}>
        <label className="form-label">Unidad (ej: Km)</label>
        <input placeholder="Libros, Km..." value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} />
      </div>
    </div>
    <button type="submit" className="btn btn-warning w-full" style={{ justifyContent: 'center', padding: 'var(--space-4)' }}>
      Empezar Meta
    </button>
  </motion.form>
);

// ── Tarjeta de tarea del dashboard con animación al completar ────────────────
const DashboardTaskCard = ({ task, onComplete }) => {
  const [completing, setCompleting] = useState(false);
  const overdue = isOverdue(task);

  const handleComplete = async () => {
    setCompleting(true);
    // Pequeña pausa para que se vea la animación del check antes de que desaparezca
    await new Promise(r => setTimeout(r, 650));
    onComplete(task.id);
  };

  return (
    <motion.div
      layout
      exit={{ opacity: 0, scale: 0.85, y: -10 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className={`card ${task.priority === 'HIGH' || overdue ? 'card-accent-danger' : 'card-accent-primary'}`}
    >
      <div className="flex-between">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontWeight: 'var(--weight-extrabold)',
            fontSize: 'var(--text-base)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {task.title}
          </h3>
          <div className="flex-start gap-3 mt-4" style={{ flexWrap: 'wrap', fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 'var(--weight-bold)' }}>
            {overdue && (
              <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <AlertCircle size={10} /> VENCIDA
              </span>
            )}
            {task.due_date && <span>{formatDate(task.due_date)}</span>}
            {task.due_date && <span>{formatTime12h(task.due_date)}</span>}
          </div>
        </div>

        {/* Botón de completar con animación */}
        <motion.button
          onClick={handleComplete}
          disabled={completing}
          className="btn-icon"
          title="Completar tarea"
          animate={completing ? { scale: [1, 1.35, 1], rotate: [0, -10, 10, 0] } : {}}
          transition={{ duration: 0.45 }}
          style={{
            backgroundColor: completing ? 'var(--color-success-ghost)' : undefined,
            flexShrink: 0,
            marginLeft: 'var(--space-3)',
          }}
        >
          <CheckCircle2
            size={22}
            color={completing ? 'var(--color-success)' : 'var(--color-primary-light)'}
            fill={completing ? 'var(--color-success-ghost)' : 'none'}
          />
        </motion.button>
      </div>
    </motion.div>
  );
};

// ── Dashboard principal ───────────────────────────────────────────────────────
const BLANK_FORM = { title: '', date: '', time: '08:00', target: 100, unit: '', priority: 'MEDIUM' };

const Dashboard = () => {
  const [data, setData]               = useState({ tasks: [], routines: [], goals: [], logs: [] });
  const [loading, setLoading]         = useState(true);
  const [quickAdd, setQuickAdd]       = useState(null);
  const [formData, setFormData]       = useState(BLANK_FORM);
  const [selectedDays, setSelectedDays] = useState([]);

  const fetchData = async () => {
    try {
      // Primero intentamos el endpoint de resumen (online)
      // Si falla o estamos offline, reconstruimos desde las tablas locales
      if (navigator.onLine) {
        const { data: summary } = await apiCall('GET', '/dashboard/summary/');
        setData({
          tasks:    summary.tasks    ?? [],
          routines: summary.routines ?? [],
          goals:    summary.goals    ?? [],
          logs:     summary.logs     ?? [],
        });
      } else {
        const [tasks, routines, goals, logs] = await Promise.all([
          apiCall('GET', '/tasks/'),
          apiCall('GET', '/routines/'),
          apiCall('GET', '/goals/'),
          apiCall('GET', '/progress/'),
        ]);
        setData({
          tasks:    tasks.data    ?? [],
          routines: routines.data ?? [],
          goals:    goals.data    ?? [],
          logs:     logs.data     ?? [],
        });
      }
      setLoading(false);
    } catch (e) {
      console.error('Error cargando dashboard:', e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('sync_update', fetchData);
    return () => window.removeEventListener('sync_update', fetchData);
  }, []);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    try {
      let endpoint = '';
      let payload  = { title: formData.title };
      if (quickAdd === 'task') {
        endpoint = '/tasks/';
        payload.due_date = formData.date ? `${formData.date}T${formData.time}:00` : null;
        payload.priority = formData.priority;
      } else if (quickAdd === 'routine') {
        endpoint = '/routines/';
        payload.time         = formData.time;
        payload.days_of_week = selectedDays.join(',');
      } else if (quickAdd === 'goal') {
        endpoint = '/goals/';
        payload.target_value = formData.target;
        payload.unit         = formData.unit;
      }
      await apiCall('POST', endpoint, payload);
      setFormData(BLANK_FORM);
      setSelectedDays([]);
      setQuickAdd(null);
      fetchData();
    } catch (e) { console.error('Error guardando:', e); }
  };

  const completeTask = async (taskId) => {
    await apiCall('PATCH', `/tasks/${taskId}/`, { is_completed: true });
    fetchData();
  };

  const getDayStatus = (routine, dayOffset) => {
    const d = new Date();
    d.setDate(d.getDate() - (d.getDay() - 1) + dayOffset);
    const dateStr  = d.toISOString().split('T')[0];
    const dayNames = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    if (!routine.days_of_week.includes(dayNames[dayOffset])) return 'inactive';
    const isLogged = data.logs.some(l =>
      l.content_type === 'routine' && l.object_id === routine.id && l.date === dateStr
    );
    return isLogged ? 'completed' : 'active';
  };

  if (loading) return (
    <div className="loading-center">
      <DashboardIcon className="spin" size={48} color="var(--color-primary)" />
    </div>
  );

  // Tareas pendientes ordenadas por fecha más próxima primero (vencidas al tope)
  const pendingTasks = sortByDueDate(data.tasks.filter(t => !t.is_completed)).slice(0, 4);

  const toggleSection = (type) => setQuickAdd(quickAdd === type ? null : type);

  // Helper: check if a routine is already completed today
  const isCompletedToday = (routineId) =>
    data.logs.some(l =>
      l.content_type === 'routine' &&
      l.object_id === routineId &&
      l.date === todayISO()
    );

  // Handle marking routine as complete today (prevent duplicates)
  const handleRoutineDone = async (routine) => {
    if (isCompletedToday(routine.id)) return;
    try {
      await apiCall('POST', '/progress/', {
        content_type: 'routine', object_id: routine.id, date: todayISO(), value: 1,
      });
      fetchData();
    } catch (e) {
      // unique_together constraint — ya estaba registrado, sólo refrescamos
      fetchData();
    }
  };

  return (
    <div className="page-container">

      {/* Hero — mensaje de bienvenida sin repetir el logo que ya está en el top bar */}
      <header className="dashboard-hero" style={{ marginTop: 'var(--space-2)' }}>
        <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-black)', margin: 0, color: 'var(--fg)' }}>
          Bienvenido 👋
        </p>
        <p style={{ color: 'var(--muted)', marginTop: 'var(--space-1)' }}>Tu espacio personal de enfoque.</p>
      </header>

      {/* ── Tareas ── */}
      <section>
        <SectionHeader
          title="Tareas"
          icon={<CheckSquare size={28} color="var(--color-primary-light)" />}
          action={
            <button onClick={() => toggleSection('task')} className="btn-icon"
              style={{ backgroundColor: 'var(--color-primary-ghost)', color: 'var(--color-primary-light)' }}>
              {quickAdd === 'task' ? <X size={20} /> : <Plus size={20} />}
            </button>
          }
        />
        <AnimatePresence>
          {quickAdd === 'task' && (
            <TaskQuickForm formData={formData} setFormData={setFormData} onSubmit={handleQuickAdd} />
          )}
        </AnimatePresence>
        <div className="grid-cards">
          <AnimatePresence mode="popLayout">
            {pendingTasks.map(task => (
              <DashboardTaskCard key={task.id} task={task} onComplete={completeTask} />
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Rutinas ── */}
      <section>
        <SectionHeader
          title="Rutinas"
          icon={<Repeat size={28} color="var(--color-success)" />}
          action={
            <button onClick={() => toggleSection('routine')} className="btn-icon"
              style={{ backgroundColor: 'var(--color-success-ghost)', color: 'var(--color-success)' }}>
              {quickAdd === 'routine' ? <X size={20} /> : <Plus size={20} />}
            </button>
          }
        />
        <AnimatePresence>
          {quickAdd === 'routine' && (
            <RoutineQuickForm formData={formData} setFormData={setFormData}
              selectedDays={selectedDays} setSelectedDays={setSelectedDays} onSubmit={handleQuickAdd} />
          )}
        </AnimatePresence>
        <div className="grid-cards">
          {data.routines.map(routine => {
            const doneToday = isCompletedToday(routine.id);
            return (
              <div key={routine.id} className={`card ${doneToday ? 'card-accent-success' : ''}`}>
                <div className="flex-between mb-6">
                  <div>
                    <h3 style={{ fontWeight: 'var(--weight-extrabold)', fontSize: 'var(--text-lg)' }}>{routine.title}</h3>
                    <span className="flex-start gap-2 text-muted text-sm" style={{ fontWeight: 'var(--weight-bold)', marginTop: 'var(--space-1)' }}>
                      <Clock size={14} /> {formatTime12h(routine.time)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRoutineDone(routine)}
                    disabled={doneToday}
                    className="btn-icon"
                    title={doneToday ? 'Ya completada hoy' : 'Marcar completada hoy'}
                    style={{
                      backgroundColor: doneToday ? 'var(--color-success-ghost)' : undefined,
                      cursor: doneToday ? 'default' : 'pointer',
                    }}
                  >
                    <CheckCircle2 size={22} color={doneToday ? 'var(--color-success)' : 'var(--color-success)'}
                      fill={doneToday ? 'var(--color-success-ghost)' : 'none'} />
                  </button>
                </div>
                <div className="day-track">
                  {DAYS.map((day, i) => (
                    <div key={day.id} className="day-track-item">
                      <div className={`day-track-bar ${getDayStatus(routine, i)}`} />
                      <span className="day-track-label">{day.label}</span>
                    </div>
                  ))}
                </div>
                {doneToday && (
                  <div style={{
                    marginTop: 'var(--space-4)', textAlign: 'center',
                    fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)',
                    color: 'var(--color-success-light)',
                  }}>
                    ✓ Completada hoy
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Metas ── */}
      <section>
        <SectionHeader
          title="Metas"
          icon={<Target size={28} color="var(--color-warning)" />}
          action={
            <button onClick={() => toggleSection('goal')} className="btn-icon"
              style={{ backgroundColor: 'var(--color-warning-ghost)', color: 'var(--color-warning)' }}>
              {quickAdd === 'goal' ? <X size={20} /> : <Plus size={20} />}
            </button>
          }
        />
        <AnimatePresence>
          {quickAdd === 'goal' && (
            <GoalQuickForm formData={formData} setFormData={setFormData} onSubmit={handleQuickAdd} />
          )}
        </AnimatePresence>
        <div className="grid-cards">
          {data.goals.map(goal => (
            <div key={goal.id} className="card card-accent-warning">
              <div className="flex-between mb-4">
                <h3 style={{ fontWeight: 'var(--weight-extrabold)', fontSize: 'var(--text-lg)' }}>{goal.title}</h3>
                <button onClick={() => apiCall('PATCH', `/goals/${goal.id}/`, { current_value: goal.current_value + 1 }).then(fetchData)}
                  className="btn btn-warning" style={{ padding: '0.4rem 0.8rem', fontSize: 'var(--text-xs)' }}>
                  +1 {goal.unit}
                </button>
              </div>
              <div className="progress-bar mb-4">
                <motion.div className="progress-fill" initial={{ width: 0 }}
                  animate={{ width: `${Math.min((goal.current_value / goal.target_value) * 100, 100)}%` }} />
              </div>
              <p className="text-muted text-xs" style={{ fontWeight: 'var(--weight-bold)' }}>
                {goal.current_value} / {goal.target_value} {goal.unit}
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default Dashboard;
