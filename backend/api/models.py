"""
ZenTask — Modelos de base de datos
Organización: User → Category → Task / Routine / Goal → ProgressLog
Todos los modelos principales usan UUID como llave primaria para soportar
creación offline en el cliente sin colisiones de IDs.
"""

import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator


# ── Usuarios ──────────────────────────────────────────────────────────────────

class User(AbstractUser):
    """Usuario extendido de ZenTask."""

    email = models.EmailField(unique=True)
    avatar_url = models.URLField(blank=True)
    timezone = models.CharField(max_length=64, default='UTC')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return self.username


# ── Categorías ─────────────────────────────────────────────────────────────────

class Category(models.Model):
    """Categoría o etiqueta personalizada por usuario (p.ej. 'Trabajo', 'Salud')."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default='#7c3aed')  # HEX color
    icon = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        ordering = ['name']

    def __str__(self):
        return f'{self.user.username} / {self.name}'


# ── Tareas ─────────────────────────────────────────────────────────────────────

class Task(models.Model):
    """Tarea puntual con fecha, prioridad y estado de completado."""

    class Priority(models.TextChoices):
        LOW    = 'LOW',    'Baja'
        MEDIUM = 'MEDIUM', 'Media'
        HIGH   = 'HIGH',   'Alta'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='tasks'
    )

    # Contenido principal
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)   # notas adicionales

    # Fechas
    due_date = models.DateTimeField(null=True, blank=True)
    reminder_at = models.DateTimeField(null=True, blank=True)  # recordatorio
    completed_at = models.DateTimeField(null=True, blank=True) # cuándo se completó

    # Estado y configuración
    priority = models.CharField(
        max_length=10, choices=Priority.choices, default=Priority.MEDIUM
    )
    is_completed = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)   # tareas fijadas al tope

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Tarea'
        verbose_name_plural = 'Tareas'
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return self.title


# ── Rutinas ────────────────────────────────────────────────────────────────────

class Routine(models.Model):
    """Hábito o actividad recurrente programada en días de la semana."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='routines')
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='routines'
    )

    # Contenido principal
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    days_of_week = models.CharField(max_length=50)  # Ej: "mon,tue,wed"
    time = models.TimeField()

    # Duración estimada en minutos (opcional)
    duration_minutes = models.PositiveSmallIntegerField(null=True, blank=True)

    # Estado
    is_active = models.BooleanField(default=True)
    color = models.CharField(max_length=7, default='#0d9488')  # acento visual

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Rutina'
        verbose_name_plural = 'Rutinas'
        ordering = ['time']

    def __str__(self):
        return self.title


# ── Metas ──────────────────────────────────────────────────────────────────────

class Goal(models.Model):
    """Meta cuantificable con valor objetivo y progreso actual."""

    class Status(models.TextChoices):
        ACTIVE    = 'ACTIVE',    'Activa'
        PAUSED    = 'PAUSED',    'Pausada'
        COMPLETED = 'COMPLETED', 'Completada'
        ABANDONED = 'ABANDONED', 'Abandonada'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='goals'
    )

    # Contenido principal
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    # Progreso numérico
    target_value = models.FloatField(validators=[MinValueValidator(0)])
    current_value = models.FloatField(default=0, validators=[MinValueValidator(0)])
    unit = models.CharField(max_length=50, blank=True)  # Ej: "Km", "Libros"

    # Fechas
    deadline = models.DateField(null=True, blank=True)
    started_at = models.DateField(null=True, blank=True)  # inicio formal de la meta

    # Estado
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.ACTIVE
    )
    is_public = models.BooleanField(default=False)   # para compartir en el futuro

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Meta'
        verbose_name_plural = 'Metas'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def progress_pct(self):
        if self.target_value == 0:
            return 0
        return min(round((self.current_value / self.target_value) * 100, 1), 100)


# ── Registros de Progreso ──────────────────────────────────────────────────────

class ProgressLog(models.Model):
    """
    Registro diario de progreso para rutinas o metas.
    content_type + object_id identifican el recurso (rutina o meta).
    """

    class ContentType(models.TextChoices):
        ROUTINE = 'routine', 'Rutina'
        GOAL    = 'goal',    'Meta'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress_logs')

    content_type = models.CharField(max_length=20, choices=ContentType.choices)
    object_id = models.UUIDField()   # UUID de la rutina o meta
    date = models.DateField()
    value = models.FloatField(default=1)
    notes = models.TextField(blank=True)  # nota opcional del día

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Registro de Progreso'
        verbose_name_plural = 'Registros de Progreso'
        unique_together = ('content_type', 'object_id', 'date')
        ordering = ['-date']

    def __str__(self):
        return f'{self.content_type} {self.object_id} · {self.date}'


# ── Preguntas de Seguridad ─────────────────────────────────────────────────────

SECURITY_QUESTIONS = [
    ('pet',     '¿Cuál es el nombre de tu mascota?'),
    ('movie',   '¿Cuál es tu película favorita?'),
    ('country', '¿Qué país te gustaría visitar?'),
    ('friend',  '¿Cuál es el nombre de tu mejor amigo de la infancia?'),
    ('school',  '¿Cuál es el nombre de tu escuela primaria?'),
    ('food',    '¿Cuál es tu comida favorita?'),
]

class SecurityAnswer(models.Model):
    """Respuestas a 3 preguntas de seguridad por usuario para recuperar contraseña."""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='security_answers'
    )

    question_1 = models.CharField(max_length=20, choices=SECURITY_QUESTIONS)
    answer_1   = models.CharField(max_length=255)

    question_2 = models.CharField(max_length=20, choices=SECURITY_QUESTIONS)
    answer_2   = models.CharField(max_length=255)

    question_3 = models.CharField(max_length=20, choices=SECURITY_QUESTIONS)
    answer_3   = models.CharField(max_length=255)

    class Meta:
        verbose_name = 'Respuesta de Seguridad'
        verbose_name_plural = 'Respuestas de Seguridad'

    def check_answer(self, question_key, answer):
        """Verifica si la respuesta coincide con la pregunta dada (insensible a mayúsculas/espacios)."""
        answer_clean = answer.strip().lower()
        if self.question_1 == question_key:
            return self.answer_1.strip().lower() == answer_clean
        if self.question_2 == question_key:
            return self.answer_2.strip().lower() == answer_clean
        if self.question_3 == question_key:
            return self.answer_3.strip().lower() == answer_clean
        return False

    def __str__(self):
        return f'Seguridad de {self.user.username}'
