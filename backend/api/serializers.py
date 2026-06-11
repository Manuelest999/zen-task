from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Category, Task, Routine, Goal, ProgressLog

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'avatar_url', 'timezone')
        read_only_fields = ('id',)

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
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
