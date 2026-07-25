import random
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.contrib.auth import get_user_model

from .models import Category, Task, Routine, Goal, ProgressLog, SecurityAnswer, SECURITY_QUESTIONS
from .serializers import (
    UserSerializer, CategorySerializer, TaskSerializer,
    RoutineSerializer, GoalSerializer, ProgressLogSerializer
)

User = get_user_model()

# Mapa key → texto de pregunta para devolver al frontend
QUESTION_MAP = dict(SECURITY_QUESTIONS)


class UserRegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BaseUserViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CategoryViewSet(BaseUserViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class TaskViewSet(BaseUserViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer


class RoutineViewSet(BaseUserViewSet):
    queryset = Routine.objects.all()
    serializer_class = RoutineSerializer


class GoalViewSet(BaseUserViewSet):
    queryset = Goal.objects.all()
    serializer_class = GoalSerializer


class ProgressLogViewSet(BaseUserViewSet):
    queryset = ProgressLog.objects.all()
    serializer_class = ProgressLogSerializer


# ── Recuperación por preguntas de seguridad ────────────────────────────────────

class SecurityQuestionGetView(APIView):
    """
    POST { username } → devuelve una pregunta aleatoria de las 3 del usuario.
    Responde con { question_key, question_text } para que el frontend lo muestre.
    Siempre responde 200 aunque el usuario no exista (evita enumeración).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()

        if not username:
            return Response(
                {'error': 'El nombre de usuario es requerido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(username=username)
            answers = SecurityAnswer.objects.get(user=user)
        except (User.DoesNotExist, SecurityAnswer.DoesNotExist):
            # Respuesta genérica para no revelar si el usuario existe
            return Response(
                {'error': 'No se encontró el usuario o no tiene preguntas de seguridad configuradas.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Elegir una de las 3 preguntas al azar
        options = [answers.question_1, answers.question_2, answers.question_3]
        chosen_key = random.choice(options)

        return Response({
            'question_key':  chosen_key,
            'question_text': QUESTION_MAP.get(chosen_key, chosen_key),
        }, status=status.HTTP_200_OK)


class PasswordResetBySecurityView(APIView):
    """
    POST { username, question_key, answer, new_password }
    → verifica la respuesta y cambia la contraseña si es correcta.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username     = request.data.get('username', '').strip()
        question_key = request.data.get('question_key', '').strip()
        answer       = request.data.get('answer', '').strip()
        new_password = request.data.get('new_password', '')

        if not username or not question_key or not answer or not new_password:
            return Response(
                {'error': 'Todos los campos son requeridos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 8:
            return Response(
                {'error': 'La nueva contraseña debe tener al menos 8 caracteres.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(username=username)
            answers = SecurityAnswer.objects.get(user=user)
        except (User.DoesNotExist, SecurityAnswer.DoesNotExist):
            return Response(
                {'error': 'Usuario o respuesta incorrectos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not answers.check_answer(question_key, answer):
            return Response(
                {'error': 'La respuesta es incorrecta.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {'message': 'Contraseña restablecida con éxito.'},
            status=status.HTTP_200_OK
        )


# ── Dashboard ──────────────────────────────────────────────────────────────────

class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        tasks    = Task.objects.filter(user=user)
        routines = Routine.objects.filter(user=user)
        goals    = Goal.objects.filter(user=user)
        logs     = ProgressLog.objects.filter(user=user)

        return Response({
            'tasks':    TaskSerializer(tasks, many=True).data,
            'routines': RoutineSerializer(routines, many=True).data,
            'goals':    GoalSerializer(goals, many=True).data,
            'logs':     ProgressLogSerializer(logs, many=True).data,
        })
