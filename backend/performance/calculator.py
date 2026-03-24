"""
Performance Calculation Engine
Calculates weighted performance index for each athlete based on their test results.
"""
from django.db.models import Max, Min
from .models import TestResult, PerformanceSummary, PerformanceMetric
from academy.models import AthleteProfile


def normalize_value(value, min_val, max_val, higher_is_better):
    """
    Normalize a metric value to a 0-100 score.
    If higher is better: score = (value / max) * 100
    If lower is better:  score = (min / value) * 100
    """
    if value is None:
        return 0.0

    value = float(value)
    min_val = float(min_val) if min_val is not None else value
    max_val = float(max_val) if max_val is not None else value

    if higher_is_better:
        if max_val == 0:
            return 0.0
        return min(100.0, (value / max_val) * 100.0)
    else:
        if value == 0:
            return 100.0
        if min_val == 0:
            return 0.0
        return min(100.0, (min_val / value) * 100.0)


def calculate_performance_index(athlete_id, sport_id):
    """
    Calculate the overall performance index for an athlete in a sport.
    
    Steps:
    1. For each metric in the sport, get the athlete's latest value
    2. Find the global max/min across all athletes for normalization
    3. Normalize value to 0-100 using higher/lower is better logic
    4. Apply weight_percentage to get weighted score
    5. Sum all weighted scores to get overall performance_index
    
    Returns: PerformanceSummary instance
    """
    metrics = PerformanceMetric.objects.filter(sport_id=sport_id)
    
    if not metrics.exists():
        return None

    total_weight = 0.0
    weighted_sum = 0.0

    for metric in metrics:
        # Get athlete's latest result for this metric
        athlete_results = TestResult.objects.filter(
            athlete_id=athlete_id,
            metric=metric
        ).order_by('-session__date', '-recorded_at')

        if not athlete_results.exists():
            continue

        latest_value = float(athlete_results.first().value)

        # Get global range for this metric (across ALL athletes)
        agg = TestResult.objects.filter(metric=metric).aggregate(
            max_val=Max('value'),
            min_val=Min('value')
        )
        max_val = float(agg['max_val']) if agg['max_val'] is not None else latest_value
        min_val = float(agg['min_val']) if agg['min_val'] is not None else latest_value

        normalized = normalize_value(latest_value, min_val, max_val, metric.higher_is_better)
        weight = float(metric.weight_percentage)

        weighted_sum += normalized * (weight / 100.0)
        total_weight += weight

    if total_weight == 0:
        performance_index = 0.0
    else:
        # Scale back up if total weights != 100 (handles partial metric completion)
        performance_index = (weighted_sum / total_weight) * 100.0

    # Round to 2 decimal places
    performance_index = round(performance_index, 2)

    # Save/update the summary
    summary, _ = PerformanceSummary.objects.update_or_create(
        athlete_id=athlete_id,
        sport_id=sport_id,
        defaults={'performance_index': performance_index}
    )

    return summary


def recalculate_batch_rankings(batch):
    """
    Recalculate performance indices for all athletes in a batch,
    then assign rank positions sorted by performance_index descending.
    """
    sport = batch.sport
    athlete_profiles = AthleteProfile.objects.filter(
        batch=batch, is_active=True
    ).select_related('user')

    summaries = []
    for profile in athlete_profiles:
        summary = calculate_performance_index(profile.user.id, sport.id)
        if summary:
            summaries.append(summary)

    # Sort by performance_index descending, assign ranks
    summaries.sort(key=lambda s: float(s.performance_index), reverse=True)
    for rank, summary in enumerate(summaries, start=1):
        summary.rank_in_batch = rank
        summary.save(update_fields=['rank_in_batch'])

    return summaries


def get_radar_data(athlete_id, sport_id):
    """
    Return normalized scores per metric for radar/spider chart.
    Each metric is represented as a percentage (0-100).
    """
    metrics = PerformanceMetric.objects.filter(sport_id=sport_id)
    radar = []

    for metric in metrics:
        athlete_results = TestResult.objects.filter(
            athlete_id=athlete_id, metric=metric
        ).order_by('-session__date', '-recorded_at')

        if not athlete_results.exists():
            radar.append({
                'metric': metric.name,
                'score': 0,
                'raw_value': None,
                'unit': metric.unit,
                'higher_is_better': metric.higher_is_better,
            })
            continue

        latest_value = float(athlete_results.first().value)
        agg = TestResult.objects.filter(metric=metric).aggregate(
            max_val=Max('value'),
            min_val=Min('value')
        )
        max_val = float(agg['max_val']) if agg['max_val'] else latest_value
        min_val = float(agg['min_val']) if agg['min_val'] else latest_value

        score = normalize_value(latest_value, min_val, max_val, metric.higher_is_better)

        radar.append({
            'metric': metric.name,
            'score': round(score, 1),
            'raw_value': latest_value,
            'unit': metric.unit,
            'higher_is_better': metric.higher_is_better,
        })

    return radar


def get_index_history(athlete_id, sport_id):
    """
    Return performance index over time by recalculating at each session date.
    Approximation: use sessions in chronological order, recalculate index at each step.
    """
    from .models import TestSession
    sessions = TestSession.objects.filter(
        sport_id=sport_id,
        results__athlete_id=athlete_id
    ).distinct().order_by('date')

    history = []
    for session in sessions:
        # Get the set of results up to this session
        results_up_to = TestResult.objects.filter(
            athlete_id=athlete_id,
            metric__sport_id=sport_id,
            session__date__lte=session.date
        )

        weighted_sum = 0.0
        total_weight = 0.0

        metrics = PerformanceMetric.objects.filter(sport_id=sport_id)
        for metric in metrics:
            metric_results = results_up_to.filter(metric=metric).order_by('-session__date', '-recorded_at')
            if not metric_results.exists():
                continue

            value = float(metric_results.first().value)
            agg = TestResult.objects.filter(metric=metric).aggregate(
                max_val=Max('value'), min_val=Min('value')
            )
            max_val = float(agg['max_val']) if agg['max_val'] else value
            min_val = float(agg['min_val']) if agg['min_val'] else value

            normalized = normalize_value(value, min_val, max_val, metric.higher_is_better)
            weight = float(metric.weight_percentage)
            weighted_sum += normalized * (weight / 100.0)
            total_weight += weight

        if total_weight > 0:
            index = round((weighted_sum / total_weight) * 100.0, 2)
        else:
            index = 0.0

        history.append({
            'date': str(session.date),
            'session': session.name,
            'performance_index': index,
        })

    return history
