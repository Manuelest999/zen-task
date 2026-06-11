import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Clock, Edit2, CheckCircle2, Flame, TrendingUp, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DAYS, formatTime12h, apiCall, todayISO } from '../utils';
import Modal      from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';

const BLANK_ROUTINE = { title: '', time: '08:00' };

// ── Helpers de fecha ──────────────────────────────────────────────────────────
const DAY_ID_BY_JS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** Devuelve un string YYYY-MM-DD para un offset de días desde hoy */
const offsetDate = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

/** Genera los datos de los últimos N días para el heatmap */
const buildHeatmapData = (routineDays, routineLogs, totalDays = 35) => {
  const cells = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const date  = offsetDate(-i);
    const jsDay = new Date(date + 'T12:00:00').getDay(); // evita TZ issues
    const dayId = DAY_ID_BY_JS[jsDay];
    const scheduled = routineDays.includes(dayId);
    const completed = routineLogs.some(l => l.date === date);
    cells.push({ date, scheduled, completed });
  }
  return cells;
};

/** Calcula racha actual (días consecutivos completados hacia atrás desde hoy) */
const calcCurrentStreak = (routineDays, routineLogs) => {
  let streak = 0;
  let i = 0; // 0 = hoy, 1 = ayer, ...
  while (true) {
    const date  = offsetDate(-i);
    const jsDay = new Date(date + 'T12:00:00').getDay();
    const dayId = DAY_ID_BY_JS[jsDay];
    if (!routineDays.includes(dayId)) { i++; continue; } // día no programado, saltar
    if (i > 365) break; // límite de seguridad
    const done = routineLogs.some(l => l.date === date);
    if (!done) break;
    streak++;
    i++;
  }
  return streak;
};

/** Calcula la racha más larga histórica */
const calcLongestStreak = (routineDays, routineLogs) => {
  if (routineLogs.length === 0) return 0;
  const sortedDates = [...new Set(routineLogs.map(l => l.date))].sort();
  let longest = 0;
  let current = 0;
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) { current = 1; continue; }
    const prev = new Date(sortedDates[i - 1] + 'T12:00:00');
    const curr = new Date(sortedDates[i]     + 'T12:00:00');
    const diffDays = Math.round((curr - prev) / 86400000);
    // Verificar si los días intermedios no-programados están entre prev y curr
    if (diffDays === 1) {
      current++;
    } else {
      // Comprobar si los días intermedios son todos no-programados
      let allSkipped = true;
      for (let d = 1; d < diffDays; d++) {
        const mid = new Date(prev); mid.setDate(mid.getDate() + d);
        const midId = DAY_ID_BY_JS[mid.getDay()];
        if (routineDays.includes(midId)) { allSkipped = false; break; }
      }
      if (allSkipped && diffDays <= 7) { current++; }
      else { longest = Math.max(longest, current); current = 1; }
    }
    longest = Math.max(longest, current);
  }
  return Math.max(longest, current);
};

/**
 * Construye una grilla [7 filas de día x 5 columnas de semana]
 * Columna 0 = semana actual (izquierda), columna 4 = hace 4 semanas (derecha).
 * Fila 0 = lunes, fila 6 = domingo.
 */
const buildHeatmapGrid = (routineDays, routineLogs) => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  // Lunes de la semana actual
  const jsDay = today.getDay();
  const daysToMonday = jsDay === 0 ? 6 : jsDay - 1;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysToMonday);

  // grid[fila=dow][col=semana]: col 0 = esta semana, col 4 = hace 4 semanas
  const grid = Array.from({ length: 7 }, () => Array(5).fill(null));

  for (let weekOffset = 0; weekOffset < 5; weekOffset++) {
    // weekOffset 0 = esta semana, 4 = hace 4 semanas
    const weekMonday = new Date(thisMonday);
    weekMonday.setDate(thisMonday.getDate() - weekOffset * 7);

    for (let dow = 0; dow < 7; dow++) {
      const cellDate = new Date(weekMonday);
      cellDate.setDate(weekMonday.getDate() + dow);
      const dateStr = cellDate.toISOString().split('T')[0];
      const dayId = DAY_ID_BY_JS[cellDate.getDay()];
      const scheduled = routineDays.includes(dayId);
      const completed = routineLogs.some(l => l.date === dateStr);
      // Es hoy o en el pasado
      const isPastOrToday = cellDate <= today;
      grid[dow][weekOffset] = { date: dateStr, scheduled, completed, isPastOrToday };
    }
  }
  return grid;
};

// ── Componente Heatmap ────────────────────────────────────────────────────────
const RoutineHeatmap = ({ grid }) => {
  const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const getColor = (cell) => {
    if (!cell)             return 'transparent';
    if (cell.completed)    return 'var(--color-success)';   // verde: hecho
    if (cell.scheduled)    return 'var(--surface-border-solid)'; // gris: programado (pasado o futuro)
    return 'rgba(255,255,255,0.04)';                         // casi invisible: no programado
  };

  const getTitle = (cell) => {
    if (!cell) return '';
    if (cell.completed)              return `${cell.date} · ✓ Completada`;
    if (cell.scheduled && cell.isPastOrToday) return `${cell.date} · No completada`;
    if (cell.scheduled)              return `${cell.date} · Programada`;
    return `${cell.date} · Sin programar`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {grid.map((row, dowIndex) => (
        <div key={dowIndex} style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          {/* Etiqueta del día */}
          <span style={{
            width: 10, fontSize: '0.55rem', color: 'var(--text-muted)',
            fontWeight: 700, flexShrink: 0, textAlign: 'right', marginRight: 2,
          }}>
            {dayLabels[dowIndex]}
          </span>
          {/* 5 celdas (una por semana) */}
          {row.map((cell, weekIndex) => (
            <div
              key={weekIndex}
              title={getTitle(cell)}
              style={{
                width: 12, height: 12,
                borderRadius: 3,
                backgroundColor: getColor(cell),
                flexShrink: 0,
                boxShadow: cell?.completed ? '0 0 4px rgba(13,148,136,0.5)' : 'none',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// ── Componente Stat Badge ─────────────────────────────────────────────────────
const StatBadge = ({ icon: Icon, value, label, color }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '4px 10px', borderRadius: 'var(--radius-full)',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)',
  }}>
    <Icon size={13} color={color} />
    <span style={{ color: color }}>{value}</span>
    <span style={{ color: 'var(--muted)' }}>{label}</span>
  </div>
);

// ── Página Rutinas ────────────────────────────────────────────────────────────
const Routines = () => {
  const [routines, setRoutines]             = useState([]);
  const [logs, setLogs]                     = useState([]);
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [selectedDays, setSelectedDays]     = useState([]);
  const [form, setForm]                     = useState(BLANK_ROUTINE);
  const [deleteConfirm, setDeleteConfirm]   = useState(null);
  const [completing, setCompleting]         = useState(null);

  const fetchAll = async () => {
    try {
      const [{ data: r }, { data: l }] = await Promise.all([
        apiCall('GET', '/routines/'),
        apiCall('GET', '/progress/'),
      ]);
      setRoutines(r);
      setLogs(l);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchAll(); }, []);

  const isCompletedToday = (routineId) =>
    logs.some(l =>
      l.content_type === 'routine' &&
      l.object_id === routineId &&
      l.date === todayISO()
    );

  const markDoneToday = async (routine) => {
    if (isCompletedToday(routine.id) || completing === routine.id) return;
    setCompleting(routine.id);
    try {
      await apiCall('POST', '/progress/', {
        content_type: 'routine',
        object_id: routine.id,
        date: todayISO(),
        value: 1,
      });
      await fetchAll();
    } catch (e) {
      await fetchAll();
    }
    setCompleting(null);
  };

  const openCreate = () => {
    setForm(BLANK_ROUTINE);
    setSelectedDays([]);
    setEditingRoutine(null);
    setIsModalOpen(true);
  };

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
      fetchAll();
    } catch (e) { console.error(e); }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try { await apiCall('DELETE', `/routines/${deleteConfirm}/`); fetchAll(); }
    catch (e) { console.error(e); }
    setDeleteConfirm(null);
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
          {routines.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card"
              style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--muted)', gridColumn: '1/-1' }}
            >
              <p style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>
                ¡Crea tu primera rutina para construir buenos hábitos!
              </p>
            </motion.div>
          )}
          {routines.map(routine => {
            const doneToday   = isCompletedToday(routine.id);
            const isProcessing = completing === routine.id;
            const routineDays = routine.days_of_week
              ? routine.days_of_week.split(',').filter(Boolean)
              : [];
            const routineLogs = logs.filter(
              l => l.content_type === 'routine' && l.object_id === routine.id
            );

            const heatmapGrid   = buildHeatmapGrid(routineDays, routineLogs);
            const currentStreak = calcCurrentStreak(routineDays, routineLogs);
            const longestStreak = calcLongestStreak(routineDays, routineLogs);
            const totalDone     = routineLogs.length;

            return (
              <motion.div
                key={routine.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92, y: -8 }}
                transition={{ duration: 0.25 }}
                className={`card ${doneToday ? 'card-accent-success' : 'card-accent-primary'}`}
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
                    <button onClick={() => openEdit(routine)} className="btn-icon btn-icon-sm" title="Editar rutina">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => setDeleteConfirm(routine.id)} className="btn-icon btn-icon-sm btn-icon-danger" title="Eliminar rutina">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Day track */}
                <div className="day-track" style={{ marginBottom: 'var(--space-4)' }}>
                  {DAYS.map(day => (
                    <div key={day.id} className="day-track-item">
                      <div className={`day-track-bar ${routine.days_of_week?.includes(day.id) ? 'active' : 'inactive'}`} />
                      <span className="day-track-label">{day.label}</span>
                    </div>
                  ))}
                </div>

                {/* Stats de racha */}
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                  <StatBadge
                    icon={Flame}
                    value={currentStreak}
                    label={currentStreak === 1 ? 'día seguido' : 'días seguidos'}
                    color={currentStreak >= 7 ? 'var(--color-warning)' : currentStreak >= 3 ? 'var(--color-warning-light)' : 'var(--muted)'}
                  />
                  <StatBadge
                    icon={TrendingUp}
                    value={longestStreak}
                    label="mejor racha"
                    color="var(--color-primary-light)"
                  />
                  <StatBadge
                    icon={Calendar}
                    value={totalDone}
                    label="total"
                    color="var(--color-success-light)"
                  />
                </div>

                {/* Heatmap 5 semanas */}
                <div style={{
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius)',
                  padding: 'var(--space-3) var(--space-4)',
                  marginBottom: 'var(--space-4)',
                  border: '1px solid var(--border)',
                }}>
                  <p style={{
                    fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    marginBottom: 'var(--space-2)',
                  }}>
                    Últimas 5 semanas
                  </p>
                  <RoutineHeatmap grid={heatmapGrid} />
                </div>

                {/* Botón "Completada hoy" */}
                <motion.button
                  onClick={() => markDoneToday(routine)}
                  disabled={doneToday || isProcessing}
                  whileTap={!doneToday ? { scale: 0.96 } : {}}
                  style={{
                    width: '100%',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius)',
                    border: `2px solid ${doneToday ? 'var(--color-success)' : 'var(--color-success-ghost)'}`,
                    background: doneToday ? 'var(--color-success-ghost)' : 'transparent',
                    color: doneToday ? 'var(--color-success-light)' : 'var(--color-success)',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 'var(--weight-bold)',
                    fontSize: 'var(--text-sm)',
                    cursor: doneToday ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-2)',
                    transition: 'all var(--duration-base) var(--ease-out)',
                  }}
                >
                  <CheckCircle2 size={16} />
                  {isProcessing ? 'Guardando...' : doneToday ? '✓ Completada hoy' : 'Marcar como hecha hoy'}
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modal crear / editar */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingRoutine ? 'Editar Rutina' : 'Nueva Rutina'} maxWidth="480px">
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
            {selectedDays.length === 0 && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger-light)', margin: 0 }}>
                Selecciona al menos un día
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Hora</label>
            <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
          </div>

          <button
            type="submit"
            className="btn btn-success w-full"
            style={{ justifyContent: 'center', padding: 'var(--space-4)' }}
            disabled={selectedDays.length === 0}
          >
            {editingRoutine ? 'Guardar Cambios' : 'Crear Rutina'}
          </button>
        </form>
      </Modal>

      {/* Modal confirmación de eliminación */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar Rutina" maxWidth="400px">
        <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
          ¿Seguro que quieres eliminar esta rutina? Se perderá el historial de progreso asociado.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button onClick={() => setDeleteConfirm(null)} className="btn btn-ghost w-full" style={{ justifyContent: 'center', padding: 'var(--space-4)' }}>
            Cancelar
          </button>
          <button
            onClick={confirmDelete}
            className="btn w-full"
            style={{ justifyContent: 'center', padding: 'var(--space-4)', background: 'var(--color-danger)', color: 'white', boxShadow: '0 4px 20px rgba(225,29,72,0.35)' }}
          >
            Eliminar
          </button>
        </div>
      </Modal>

    </div>
  );
};

export default Routines;
