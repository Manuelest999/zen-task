from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Category, Task, Routine, Goal, ProgressLog
from .serializers import (
    UserSerializer, CategorySerializer, TaskSerializer, 
    RoutineSerializer, GoalSerializer, ProgressLogSerializer
)

from rest_framework.views import APIView

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
