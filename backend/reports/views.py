from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Avg, Max, Min, Count
from academy.models import Attendance, Batch, AthleteProfile
from performance.models import TestResult, PerformanceMetric
from payments.models import Payment
from reports.serializers import AttendanceReportSerializer, PerformanceReportSerializer, ReceiptSerializer

class AttendanceReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        athlete_id = request.query_params.get('athlete_id')
        batch_id = request.query_params.get('batch_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        user = request.user
        queryset = Attendance.objects.select_related('schedule', 'athlete').all()

        # Role-based filtering
        if user.is_athlete:
            queryset = queryset.filter(athlete=user)
        elif user.is_coach:
            queryset = queryset.filter(athlete__athlete_profile__batch__coach=user)

        if athlete_id:
            queryset = queryset.filter(athlete_id=athlete_id)
        if batch_id:
            queryset = queryset.filter(athlete__athlete_profile__batch_id=batch_id)
        if start_date:
            queryset = queryset.filter(schedule__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(schedule__date__lte=end_date)
            
        # Compile stats
        total = queryset.count()
        attended = queryset.filter(status='PRESENT').count()
        missed = total - attended
        percentage = (attended / total * 100) if total > 0 else 0.0

        records = [
            {
                'date': str(record.schedule.date),
                'status': record.status,
                'athlete_name': f"{record.athlete.first_name} {record.athlete.last_name}".strip() or record.athlete.username
            }
            for record in queryset.order_by('-schedule__date')
        ]

        data = {
            'total_sessions': total,
            'attended': attended,
            'missed': missed,
            'attendance_percentage': round(percentage, 2),
            'records': records
        }

        serializer = AttendanceReportSerializer(data)
        return Response(serializer.data)


class PerformanceReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        athlete_id = request.query_params.get('athlete_id')
        if not athlete_id:
            return Response({'error': 'athlete_id is required'}, status=400)

        user = request.user
        if user.is_athlete and str(user.id) != str(athlete_id):
            return Response({'error': 'Forbidden'}, status=403)
        if user.is_coach and not AthleteProfile.objects.filter(user_id=athlete_id, batch__coach=user).exists():
             return Response({'error': 'Forbidden'}, status=403)

        profile = AthleteProfile.objects.filter(user_id=athlete_id).select_related('user', 'batch').first()
        if not profile:
            return Response({'error': 'Athlete not found'}, status=404)

        results = TestResult.objects.filter(athlete_id=athlete_id).select_related('metric', 'session').order_by('session__date')

        metrics_map = {}
        for r in results:
            m_id = r.metric.id
            if m_id not in metrics_map:
                metrics_map[m_id] = {
                    'metric_name': r.metric.name,
                    'metric_unit': r.metric.unit,
                    'values': []
                }
            metrics_map[m_id]['values'].append(float(r.value))

        metrics_summary = []
        for m_id, data in metrics_map.items():
            vals = data['values']
            metric = PerformanceMetric.objects.get(id=m_id)
            
            # Use 'higher_is_better' to determine actual personal best
            if metric.higher_is_better:
                personal_best = max(vals)
                # For academy best, we take the max value ever recorded for this metric
                academy_best = TestResult.objects.filter(metric=metric).aggregate(Max('value'))['value__max']
            else:
                personal_best = min(vals)
                # For lower-is-better (like sprint), academy best is the minimum value
                academy_best = TestResult.objects.filter(metric=metric).aggregate(Min('value'))['value__min']

            metrics_summary.append({
                'metric_name': data['metric_name'],
                'metric_unit': data['metric_unit'],
                'metric_type': metric.metric_type,
                'higher_is_better': metric.higher_is_better,
                'latest': vals[-1],
                'best': personal_best,
                'average': round(sum(vals)/len(vals), 2),
                'academy_best': float(academy_best) if academy_best else personal_best,
                'test_count': len(vals)
            })

        timeline = [
            {
                'date': str(r.session.date),
                'value': float(r.value),
                'metric_name': r.metric.name
            }
            for r in results
        ]

        from performance.calculator import get_index_history
        
        # Get historical performance index progression
        sport_id = profile.batch.sport_id if profile.batch else None
        index_history = []
        if sport_id:
            index_history = get_index_history(athlete_id, sport_id)

        data = {
            'athlete_id': profile.user.id,
            'athlete_name': f"{profile.user.first_name} {profile.user.last_name}".strip() or profile.user.username,
            'batch_name': profile.batch.name if profile.batch else 'None',
            'metrics': metrics_summary,
            'timeline': timeline,
            'index_history': index_history
        }

        serializer = PerformanceReportSerializer(data)
        return Response(serializer.data)


class ReceiptView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, payment_id):
        try:
            payment = Payment.objects.select_related(
                'athlete', 'fee', 'fee__fee_structure', 'fee__fee_structure__sport', 'fee__fee_structure__batch'
            ).get(payment_id=payment_id)
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found'}, status=404)

        user = request.user
        if user.is_athlete and payment.athlete != user:
            return Response({'error': 'Forbidden'}, status=403)
        # Coaches don't usually view receipts. Admins can view all.

        fee = payment.fee
        struct = fee.fee_structure
        
        batch_name = struct.batch.name if struct and struct.batch else 'Unknown'
        sport_name = struct.sport.name if struct and struct.sport else 'Unknown'

        receipt_no = f"SA-RCT-{payment.payment_id:06d}"

        data = {
            'receipt_no': receipt_no,
            'academy_name': 'Sports Academy',
            'athlete_name': f"{payment.athlete.first_name} {payment.athlete.last_name}".strip() or payment.athlete.username,
            'athlete_id': payment.athlete.id,
            'batch_name': batch_name,
            'sport_name': sport_name,
            'fee_description': fee.description or 'Training Fee',
            'amount_paid': payment.amount,
            'payment_method': payment.payment_method or 'UPI/Online',
            'razorpay_payment_id': payment.razorpay_payment_id,
            'razorpay_order_id': payment.razorpay_order_id,
            'transaction_date': payment.payment_date or payment.created_at,
            'payment_status': payment.status
        }

        serializer = ReceiptSerializer(data)
        return Response(serializer.data)


class AthleteAttendanceExportView(APIView):
    """Exports attendance records as a CSV for the logged-in athlete."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_athlete:
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        records = Attendance.objects.filter(athlete=user).select_related('schedule').order_by('-schedule__date')

        import csv
        from django.http import HttpResponse

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="my_attendance_report.csv"'

        writer = csv.writer(response)
        writer.writerow(['Date', 'Time', 'Topic', 'Status', 'Notes'])

        for record in records:
            writer.writerow([
                record.schedule.date,
                record.schedule.start_time,
                record.schedule.topic or 'Standard Protocol',
                record.status,
                record.schedule.notes or ''
            ])

        return response


class AthletePerformanceExportView(APIView):
    """Exports performance records as a PDF for the logged-in athlete."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_athlete:
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        results = TestResult.objects.filter(athlete=user).select_related('metric', 'session').order_by('-session__date')

        from django.http import HttpResponse
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="my_performance_report.pdf"'

        doc = SimpleDocTemplate(response, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()

        # Title
        title_text = f"Performance Report - {user.first_name} {user.last_name}".strip()
        if not title_text or title_text == "Performance Report -":
             title_text = f"Performance Report - {user.username}"
             
        elements.append(Paragraph(title_text, styles['Title']))
        elements.append(Spacer(1, 20))

        # Table Data
        data = [['Date', 'Session Name', 'Metric', 'Value', 'Unit', 'Notes']]
        for r in results:
            data.append([
                str(r.session.date),
                str(r.session.name),
                str(r.metric.name),
                str(float(r.value)),
                str(r.metric.unit),
                str(r.notes or '')
            ])

        # Table Layout
        table = Table(data, colWidths=[70, 100, 100, 60, 50, 120])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')]),
        ]))

        elements.append(table)
        doc.build(elements)

        return response

