from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Max, Min, Count, Q
from .models import PerformanceMetric, TestSession, TestResult, PerformanceSummary
from .serializers import (
    PerformanceMetricSerializer, TestSessionSerializer, TestResultSerializer,
    PerformanceTrendSerializer, AthletePerformanceSummarySerializer,
    PerformanceSummarySerializer, BatchRankingSerializer, BatchComparisonSerializer,
    RadarDataSerializer, IndexHistorySerializer
)
from .calculator import (
    calculate_performance_index, recalculate_batch_rankings,
    get_radar_data, get_index_history, normalize_value
)
from academy.models import Notification, AthleteProfile, Batch
from rest_framework.exceptions import PermissionDenied


class PerformanceMetricViewSet(viewsets.ModelViewSet):
    queryset = PerformanceMetric.objects.select_related('sport').all()
    serializer_class = PerformanceMetricSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = self.queryset
        sport_id = self.request.query_params.get('sport')
        if sport_id:
            queryset = queryset.filter(Q(sport_id=sport_id) | Q(sport__isnull=True))
        return queryset

    def perform_create(self, serializer):
        if not self.request.user.is_coach:
            raise PermissionDenied("Only coaches can create metrics.")
        serializer.save()

    def perform_update(self, serializer):
        if not self.request.user.is_coach:
            raise PermissionDenied("Only coaches can update metrics.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.is_coach:
            raise PermissionDenied("Only coaches can delete metrics.")
        instance.delete()


class TestSessionViewSet(viewsets.ModelViewSet):
    queryset = TestSession.objects.select_related('sport', 'conducted_by').all()
    serializer_class = TestSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return self.queryset
        elif user.is_coach:
            # Allow coaches to see all sessions for sports they are assigned to
            from academy.models import Batch
            coached_sports = Batch.objects.filter(coach=user).values_list('sport_id', flat=True)
            return self.queryset.filter(sport_id__in=coached_sports)
        return self.queryset

    def perform_create(self, serializer):
        if not self.request.user.is_coach:
            raise PermissionDenied("Only coaches can initialize new test sessions.")
        session = serializer.save(conducted_by=self.request.user)
        
        # Notify athletes associated with this sport
        athletes = AthleteProfile.objects.filter(batch__sport=session.sport, is_active=True)
        notifications = [
            Notification(
                user=athlete.user,
                title=f"New Performance Test: {session.name}",
                message=f"A new performance test has been scheduled for {session.date}. Be prepared!",
                link="/my-performance"
            )
            for athlete in athletes
        ]
        Notification.objects.bulk_create(notifications)


class TestResultViewSet(viewsets.ModelViewSet):
    queryset = TestResult.objects.select_related('session', 'athlete', 'metric').all()
    serializer_class = TestResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset
        
        if user.is_athlete:
            queryset = queryset.filter(athlete=user)
        elif user.is_coach:
            queryset = queryset.filter(athlete__athlete_profile__batch__coach=user)
        
        athlete_id = self.request.query_params.get('athlete')
        if athlete_id:
            queryset = queryset.filter(athlete_id=athlete_id)
        
        metric_id = self.request.query_params.get('metric')
        if metric_id:
            queryset = queryset.filter(metric_id=metric_id)
        
        session_id = self.request.query_params.get('session')
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        
        return queryset
    
    # ─── Trend endpoint ──────────────────────────────────────────────────────
    @action(detail=False, methods=['get'])
    def trends(self, request):
        """Get performance trends for an athlete and metric"""
        athlete_id = request.query_params.get('athlete_id')
        metric_id = request.query_params.get('metric_id')
        
        if not metric_id:
            return Response({'error': 'metric_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Start with the role-filtered queryset
        queryset = self.get_queryset()
        
        if athlete_id:
            queryset = queryset.filter(athlete_id=athlete_id)
        elif request.user.is_athlete:
            queryset = queryset.filter(athlete=request.user)
            
        results = queryset.filter(metric_id=metric_id).select_related('session', 'metric').order_by('session__date')
        
        trend_data = [
            {
                'date': result.session.date,
                'value': float(result.value),
                'metric_name': result.metric.name,
                'metric_unit': result.metric.unit
            }
            for result in results
        ]
        
        serializer = PerformanceTrendSerializer(trend_data, many=True)
        return Response(serializer.data)
    
    # ─── Per-metric summary ───────────────────────────────────────────────────
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get performance summary for an athlete(s) (per metric breakdown)"""
        athlete_id = request.query_params.get('athlete_id')
        batch_id = request.query_params.get('batch_id')
        
        # Start with the role-filtered queryset
        queryset = self.get_queryset()
        
        if athlete_id:
            queryset = queryset.filter(athlete_id=athlete_id)
        if batch_id:
            queryset = queryset.filter(athlete__athlete_profile__batch_id=batch_id)

        results = queryset.select_related('metric', 'athlete').values(
            'metric__id', 'metric__name', 'metric__description', 'metric__unit', 'metric__higher_is_better',
            'athlete__id', 'athlete__first_name', 'athlete__last_name'
        ).annotate(
            avg_value=Avg('value'),
            max_value=Max('value'),
            min_value=Min('value'),
            count=Count('id')
        ).order_by()
        
        summary_data = []
        for result in results:
            # Get all test results for this athlete and metric to calculate improvement
            metric_results = TestResult.objects.filter(
                athlete_id=result['athlete__id'],
                metric_id=result['metric__id']
            ).order_by('session__date', 'recorded_at')
            
            if metric_results.exists():
                first_value = float(metric_results.first().value)
                latest_value = float(metric_results.last().value)
                
                # Use the full history (metric_results) for lifetime stats
                all_values = [float(r.value) for r in metric_results]
                avg_val = sum(all_values) / len(all_values)
                
                if result['metric__higher_is_better']:
                    best_val = max(all_values)
                else:
                    best_val = min(all_values)
                
                # Improvement relative to very first attempt
                if first_value != 0:
                    improvement = ((latest_value - first_value) / first_value) * 100
                    if not result['metric__higher_is_better']:
                        improvement = -improvement
                else:
                    improvement = 0
                
                summary_data.append({
                    'athlete_id': result['athlete__id'],
                    'athlete_name': f"{result['athlete__first_name']} {result['athlete__last_name']}",
                    'metric_id': result['metric__id'],
                    'metric_name': result['metric__name'],
                    'metric_description': result['metric__description'],
                    'latest_value': latest_value,
                    'best_value': float(f"{best_val:.2f}"),
                    'average_value': float(f"{avg_val:.2f}"),
                    'improvement_percentage': float(f"{improvement:.2f}"),
                    'test_count': len(all_values)
                })
        
        serializer = AthletePerformanceSummarySerializer(summary_data, many=True)
        return Response(serializer.data)

    # ─── Bulk create ──────────────────────────────────────────────────────────
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Bulk create test results for a session, then auto-recalculate batch ranking"""
        session_id = request.data.get('session_id')
        results_data = request.data.get('results', [])
        
        if not session_id:
            return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = TestSession.objects.get(pk=session_id)
            if not request.user.is_admin:
                from academy.models import Batch
                coached_sports = Batch.objects.filter(coach=request.user).values_list('sport_id', flat=True)
                if session.sport_id not in coached_sports:
                    raise PermissionDenied("You can only submit results for sessions in your assigned sports.")
        except TestSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
        
        created_results = []
        affected_athlete_ids = set()

        for result_data in results_data:
            result = TestResult.objects.create(
                session_id=session_id,
                athlete_id=result_data['athlete_id'],
                metric_id=result_data['metric_id'],
                value=result_data['value'],
                notes=result_data.get('notes', '')
            )
            created_results.append(result)
            affected_athlete_ids.add(result_data['athlete_id'])

        # Auto-trigger batch recalculation for affected batches
        sport_id = session.sport_id
        affected_batches = Batch.objects.filter(
            sport_id=sport_id,
            athletes__user_id__in=affected_athlete_ids
        ).distinct()

        for batch in affected_batches:
            recalculate_batch_rankings(batch)
        
        serializer = TestResultSerializer(created_results, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # ─── Calculate / recalculate endpoint ────────────────────────────────────
    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """
        Trigger performance index calculation.
        Body: { athlete_id?, batch_id?, sport_id? }
        """
        if not (request.user.is_admin or request.user.is_coach):
            raise PermissionDenied("Only admins and coaches can trigger calculations.")

        batch_id = request.data.get('batch_id')
        athlete_id = request.data.get('athlete_id')
        sport_id = request.data.get('sport_id')

        if batch_id:
            try:
                batch = Batch.objects.get(pk=batch_id)
            except Batch.DoesNotExist:
                return Response({'error': 'Batch not found'}, status=status.HTTP_404_NOT_FOUND)

            summaries = recalculate_batch_rankings(batch)
            return Response({
                'message': f'Recalculated {len(summaries)} athlete scores for batch {batch.name}',
                'count': len(summaries)
            })

        if athlete_id and sport_id:
            summary = calculate_performance_index(athlete_id, sport_id)
            if summary:
                return Response(PerformanceSummarySerializer(summary).data)
            return Response({'message': 'No data to calculate'})

        return Response({'error': 'Provide batch_id OR (athlete_id + sport_id)'}, status=status.HTTP_400_BAD_REQUEST)

    # ─── Performance index for one athlete ────────────────────────────────────
    @action(detail=False, methods=['get'])
    def performance_index(self, request):
        """
        Get calculated performance index + rank for an athlete.
        ?athlete_id=X&sport_id=Y
        """
        athlete_id = request.query_params.get('athlete_id', request.user.id)
        sport_id = request.query_params.get('sport_id')

        if not request.user.is_admin and not request.user.is_athlete:
            if not AthleteProfile.objects.filter(user_id=athlete_id, batch__coach=request.user).exists():
                raise PermissionDenied("You do not have access to this athlete's data.")

        qs = PerformanceSummary.objects.filter(athlete_id=athlete_id)
        if sport_id:
            qs = qs.filter(sport_id=sport_id)

        serializer = PerformanceSummarySerializer(qs, many=True)
        return Response(serializer.data)

    # ─── Batch ranking ────────────────────────────────────────────────────────
    @action(detail=False, methods=['get'])
    def batch_ranking(self, request):
        """
        Get ranked performance list for a batch.
        ?batch_id=X
        """
        batch_id = request.query_params.get('batch_id')
        if not batch_id:
            return Response({'error': 'batch_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            batch = Batch.objects.select_related('sport').get(pk=batch_id)
        except Batch.DoesNotExist:
            return Response({'error': 'Batch not found'}, status=status.HTTP_404_NOT_FOUND)

        # Permission check for coaches
        if request.user.is_coach and batch.coach != request.user:
            raise PermissionDenied("You can only view rankings for your own batches.")

        athlete_profiles = AthleteProfile.objects.filter(
            batch=batch, is_active=True
        ).select_related('user')

        ranking = []
        for profile in athlete_profiles:
            try:
                ps = PerformanceSummary.objects.get(athlete=profile.user, sport=batch.sport)
                ranking.append({
                    'rank': ps.rank_in_batch or 999,
                    'athlete_id': profile.user.id,
                    'athlete_name': profile.user.get_full_name() or profile.user.username,
                    'performance_index': float(ps.performance_index),
                    'calculated_at': ps.calculated_at,
                })
            except PerformanceSummary.DoesNotExist:
                ranking.append({
                    'rank': 999,
                    'athlete_id': profile.user.id,
                    'athlete_name': profile.user.get_full_name() or profile.user.username,
                    'performance_index': 0.0,
                    'calculated_at': None,
                })

        ranking.sort(key=lambda x: x['rank'])
        serializer = BatchRankingSerializer(ranking, many=True)
        return Response(serializer.data)

    # ─── Batch comparison (athlete vs batch avg) ──────────────────────────────
    @action(detail=False, methods=['get'])
    def batch_comparison(self, request):
        """
        Athlete vs batch average per metric.
        ?batch_id=X&athlete_id=Y
        """
        batch_id = request.query_params.get('batch_id')
        athlete_id = request.query_params.get('athlete_id', request.user.id)

        if not batch_id:
            return Response({'error': 'batch_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            batch = Batch.objects.select_related('sport').get(pk=batch_id)
        except Batch.DoesNotExist:
            return Response({'error': 'Batch not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.is_coach and batch.coach != request.user:
            raise PermissionDenied("Access denied.")

        metrics = PerformanceMetric.objects.filter(sport=batch.sport)
        batch_athlete_ids = AthleteProfile.objects.filter(
            batch=batch, is_active=True
        ).values_list('user_id', flat=True)

        comparison = []
        for metric in metrics:
            # Athlete's latest value
            athlete_result = TestResult.objects.filter(
                athlete_id=athlete_id, metric=metric
            ).order_by('-session__date', '-recorded_at').first()

            athlete_value = float(athlete_result.value) if athlete_result else None

            # Batch average (latest per athlete)
            batch_values = []
            for aid in batch_athlete_ids:
                r = TestResult.objects.filter(athlete_id=aid, metric=metric).order_by('-session__date', '-recorded_at').first()
                if r:
                    batch_values.append(float(r.value))

            batch_avg = float(f"{(sum(batch_values) / len(batch_values)):.2f}") if batch_values else None

            # Global range for normalization
            agg = TestResult.objects.filter(metric=metric).aggregate(max_val=Max('value'), min_val=Min('value'))
            max_val = float(agg['max_val']) if agg['max_val'] else 1.0
            min_val = float(agg['min_val']) if agg['min_val'] else 0.0

            athlete_score = normalize_value(athlete_value, min_val, max_val, metric.higher_is_better) if athlete_value is not None else 0.0
            batch_score = normalize_value(batch_avg, min_val, max_val, metric.higher_is_better) if batch_avg is not None else 0.0

            comparison.append({
                'metric_name': metric.name,
                'metric_unit': metric.unit,
                'higher_is_better': metric.higher_is_better,
                'athlete_value': athlete_value,
                'batch_average': batch_avg,
                'athlete_score': float(f"{athlete_score:.1f}"),
                'batch_avg_score': float(f"{batch_score:.1f}"),
            })

        serializer = BatchComparisonSerializer(comparison, many=True)
        return Response(serializer.data)

    # ─── Radar chart data ─────────────────────────────────────────────────────
    @action(detail=False, methods=['get'])
    def radar(self, request):
        """
        Normalized per-metric scores for radar/spider chart.
        ?athlete_id=X&sport_id=Y
        """
        athlete_id = request.query_params.get('athlete_id', request.user.id)
        sport_id = request.query_params.get('sport_id')

        if not sport_id:
            # Try to infer from athlete's batch
            profile = AthleteProfile.objects.filter(user_id=athlete_id, is_active=True).first()
            if profile:
                sport_id = profile.batch.sport_id
            else:
                return Response({'error': 'sport_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        if not request.user.is_admin and not request.user.is_athlete:
            if not AthleteProfile.objects.filter(user_id=athlete_id, batch__coach=request.user).exists():
                raise PermissionDenied("Access denied.")

        radar_data = get_radar_data(athlete_id, sport_id)
        serializer = RadarDataSerializer(radar_data, many=True)
        return Response(serializer.data)

    # ─── Performance index history (for line chart) ───────────────────────────
    @action(detail=False, methods=['get'])
    def index_history(self, request):
        """
        Performance index over time for an athlete.
        ?athlete_id=X&sport_id=Y
        """
        athlete_id = request.query_params.get('athlete_id', request.user.id)
        sport_id = request.query_params.get('sport_id')

        if not sport_id:
            profile = AthleteProfile.objects.filter(user_id=athlete_id, is_active=True).first()
            if profile:
                sport_id = profile.batch.sport_id
            else:
                return Response({'error': 'sport_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        if not request.user.is_admin and not request.user.is_athlete:
            if not AthleteProfile.objects.filter(user_id=athlete_id, batch__coach=request.user).exists():
                raise PermissionDenied("Access denied.")

        history = get_index_history(athlete_id, sport_id)
        serializer = IndexHistorySerializer(history, many=True)
        return Response(serializer.data)
