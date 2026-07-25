from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Category, Task, Routine, Goal, ProgressLog, SecurityAnswer, SECURITY_QUESTIONS

User = get_user_model()

QUESTION_KEYS = [key for key, _ in SECURITY_QUESTIONS]


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    # Preguntas de seguridad (write-only, requeridas en el registro)
    question_1 = serializers.ChoiceField(choices=QUESTION_KEYS, write_only=True)
    answer_1   = serializers.CharField(write_only=True, max_length=255)
    question_2 = serializers.ChoiceField(choices=QUESTION_KEYS, write_only=True)
    answer_2   = serializers.CharField(write_only=True, max_length=255)
    question_3 = serializers.ChoiceField(choices=QUESTION_KEYS, write_only=True)
    answer_3   = serializers.CharField(write_only=True, max_length=255)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'password', 'avatar_url', 'timezone',
            'question_1', 'answer_1',
            'question_2', 'answer_2',
            'question_3', 'answer_3',
        )
        read_only_fields = ('id',)

    def validate(self, data):
        # Las 3 preguntas deben ser distintas
        qs = [data.get('question_1'), data.get('question_2'), data.get('question_3')]
        if len(set(qs)) != 3:
            raise serializers.ValidationError({'questions': 'Las 3 preguntas de seguridad deben ser diferentes.'})

        # Validar dominio de correo vía DNS
        email = data.get('email')
        if email:
            import socket
            domain = email.split('@')[-1]
            try:
                socket.getaddrinfo(domain, None)
            except socket.gaierror:
                raise serializers.ValidationError({'email': f"El dominio de correo '@{domain}' no existe o es inválido."})

        return data

    def create(self, validated_data):
        # Extraer campos de seguridad antes de crear el usuario
        q1 = validated_data.pop('question_1')
        a1 = validated_data.pop('answer_1')
        q2 = validated_data.pop('question_2')
        a2 = validated_data.pop('answer_2')
        q3 = validated_data.pop('question_3')
        a3 = validated_data.pop('answer_3')

        user = User.objects.create_user(**validated_data)

        SecurityAnswer.objects.create(
            user=user,
            question_1=q1, answer_1=a1.strip().lower(),
            question_2=q2, answer_2=a2.strip().lower(),
            question_3=q3, answer_3=a3.strip().lower(),
        )
        return user


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ('user',)
        # El frontend puede proveer su propio UUID (offline-first)
        extra_kwargs = {'id': {'read_only': False, 'required': False}}


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ('user',)
        # El frontend puede proveer su propio UUID (offline-first)
        extra_kwargs = {'id': {'read_only': False, 'required': False}}


class RoutineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Routine
        fields = '__all__'
        read_only_fields = ('user',)
        extra_kwargs = {'id': {'read_only': False, 'required': False}}


class GoalSerializer(serializers.ModelSerializer):
    # Campo calculado de solo lectura
    progress_pct = serializers.FloatField(read_only=True)

    class Meta:
        model = Goal
        fields = '__all__'
        read_only_fields = ('user',)
        extra_kwargs = {'id': {'read_only': False, 'required': False}}


class ProgressLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgressLog
        fields = '__all__'
        read_only_fields = ('user',)
        extra_kwargs = {'id': {'read_only': False, 'required': False}}
