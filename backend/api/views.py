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


import random
from django.core.mail import send_mail
from django.contrib.auth import get_user_model

User = get_user_model()

class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'El correo electrónico es requerido.'}, status=status.HTTP_400_BAD_REQUEST)
        
        users = User.objects.filter(email=email)
        if users.exists():
            user = users.first()
            # Generar código de 6 dígitos
            code = f"{random.randint(100000, 999999)}"
            
            from .models import PasswordResetCode
            PasswordResetCode.objects.create(user=user, code=code)
            
            subject = 'Código de recuperación de contraseña - ZenTask'
            message = f'Hola {user.username},\n\nTu código de recuperación es: {code}\n\nEste código es válido por 15 minutos.'
            try:
                send_mail(
                    subject,
                    message,
                    None,
                    [email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Error al enviar correo: {e}")
        
        # Retorna éxito siempre para evitar la enumeración de usuarios
        return Response({'message': 'Si el correo está registrado, recibirás un código de recuperación.'}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        new_password = request.data.get('password')
        
        if not email or not code or not new_password:
            return Response({'error': 'Todos los campos son requeridos.'}, status=status.HTTP_400_BAD_REQUEST)
            
        users = User.objects.filter(email=email)
        if not users.exists():
            return Response({'error': 'Correo o código inválido.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = users.first()
        
        from .models import PasswordResetCode
        reset_code_qs = PasswordResetCode.objects.filter(user=user, code=code, is_used=False).order_by('-created_at')
        
        if not reset_code_qs.exists():
            return Response({'error': 'Código inválido o ya utilizado.'}, status=status.HTTP_400_BAD_REQUEST)
            
        reset_code = reset_code_qs.first()
        
        if reset_code.is_expired():
            return Response({'error': 'El código ha expirado.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(new_password)
        user.save()
        
        reset_code.is_used = True
        reset_code.save()
        
        return Response({'message': 'Contraseña restablecida con éxito.'}, status=status.HTTP_200_OK)


class PasswordResetVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        
        if not email or not code:
            return Response({'error': 'El correo y el código son requeridos.'}, status=status.HTTP_400_BAD_REQUEST)
            
        users = User.objects.filter(email=email)
        if not users.exists():
            return Response({'error': 'Correo o código incorrecto.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = users.first()
        
        from .models import PasswordResetCode
        reset_code_qs = PasswordResetCode.objects.filter(user=user, code=code, is_used=False).order_by('-created_at')
        
        if not reset_code_qs.exists():
            return Response({'error': 'Código incorrecto o inválido.'}, status=status.HTTP_400_BAD_REQUEST)
            
        reset_code = reset_code_qs.first()
        
        if reset_code.is_expired():
            return Response({'error': 'El código ha expirado.'}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({'message': 'Código verificado con éxito.'}, status=status.HTTP_200_OK)


