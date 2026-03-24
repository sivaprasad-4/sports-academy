from rest_framework import serializers
from .models import PerformanceMetric, TestSession, TestResult, PerformanceSummary


class PerformanceMetricSerializer(serializers.ModelSerializer):
    sport_name = serializers.CharField(source='sport.name', read_only=True)
    
    class Meta:
        model = PerformanceMetric
        fields = '__all__'


class TestSessionSerializer(serializers.ModelSerializer):
    sport_name = serializers.CharField(source='sport.name', read_only=True)
    conducted_by_name = serializers.CharField(source='conducted_by.get_full_name', read_only=True)
    result_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TestSession
        fields = '__all__'
    
    def get_result_count(self, obj):
        return obj.results.count()


class TestResultSerializer(serializers.ModelSerializer):
    athlete_name = serializers.CharField(source='athlete.get_full_name', read_only=True)
    metric_name = serializers.CharField(source='metric.name', read_only=True)
    metric_unit = serializers.CharField(source='metric.unit', read_only=True)
    session_date = serializers.DateField(source='session.date', read_only=True)
    
    class Meta:
        model = TestResult
        fields = '__all__'


class PerformanceTrendSerializer(serializers.Serializer):
    """Serializer for performance trend data"""
    date = serializers.DateField()
    value = serializers.DecimalField(max_digits=10, decimal_places=2)
    metric_name = serializers.CharField()
    metric_unit = serializers.CharField()


class AthletePerformanceSummarySerializer(serializers.Serializer):
    """Serializer for athlete performance summary"""
    athlete_id = serializers.IntegerField()
    athlete_name = serializers.CharField()
    metric_id = serializers.IntegerField()
    metric_name = serializers.CharField()
    metric_description = serializers.CharField(allow_null=True, required=False)
    latest_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    best_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    average_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    improvement_percentage = serializers.FloatField()
    test_count = serializers.IntegerField()


class PerformanceSummarySerializer(serializers.ModelSerializer):
    athlete_name = serializers.CharField(source='athlete.get_full_name', read_only=True)
    sport_name = serializers.CharField(source='sport.name', read_only=True)

    class Meta:
        model = PerformanceSummary
        fields = '__all__'


class BatchRankingSerializer(serializers.Serializer):
    """Ranked list of athletes within a batch"""
    rank = serializers.IntegerField()
    athlete_id = serializers.IntegerField()
    athlete_name = serializers.CharField()
    performance_index = serializers.FloatField()
    calculated_at = serializers.DateTimeField()


class BatchComparisonSerializer(serializers.Serializer):
    """Athlete vs batch average per metric"""
    metric_name = serializers.CharField()
    metric_unit = serializers.CharField()
    higher_is_better = serializers.BooleanField()
    athlete_value = serializers.FloatField(allow_null=True)
    batch_average = serializers.FloatField(allow_null=True)
    athlete_score = serializers.FloatField()     # Normalized 0-100
    batch_avg_score = serializers.FloatField()   # Normalized 0-100


class RadarDataSerializer(serializers.Serializer):
    """Normalized scores per metric for radar chart"""
    metric = serializers.CharField()
    score = serializers.FloatField()
    raw_value = serializers.FloatField(allow_null=True)
    unit = serializers.CharField()
    higher_is_better = serializers.BooleanField()


class IndexHistorySerializer(serializers.Serializer):
    """Performance index over time"""
    date = serializers.CharField()
    session = serializers.CharField()
    performance_index = serializers.FloatField()
