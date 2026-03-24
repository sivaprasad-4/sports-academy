import csv
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Q, Count
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import Sport, Batch, AthleteProfile, CoachProfile, Schedule, Attendance, Notification, Announcement, AthleteFeedback, Fee, FeeStructure
from .serializers import (
    SportSerializer, BatchSerializer, AthleteProfileSerializer,
    CoachProfileSerializer, ScheduleSerializer, AttendanceSerializer,
    AttendanceStatsSerializer, NotificationSerializer,
    AnnouncementSerializer, AthleteFeedbackSerializer, FeeSerializer, FeeStructureSerializer
)

class IsAdminOrReadOnly(permissions.BasePermission):
    """Custom permission: Admin can edit, others can only read"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.is_admin

class IsAdminOrCoachOwner(permissions.BasePermission):
    """Custom permission: Admin can do anything, Coaches can edit their own assigned entities, Athletes can edit their own profile"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_admin or request.user.is_coach:
            return True
        
        # Allow Athletes to access their own data via 'me' action
        if getattr(view, 'action', None) == 'me':
            return True
            
        return request.method in permissions.SAFE_METHODS

    def has_object_permission(self, request, view, obj):
        if request.user.is_admin:
            return True
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Check if it's the user's own profile
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
            
        # Check direct coach assignment
        if hasattr(obj, 'coach') and obj.coach == request.user:
            return True
            
        # For Schedule/Attendance, also allow the Batch coach
        if hasattr(obj, 'batch') and obj.batch and obj.batch.coach == request.user:
            return True
            
        return False


class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.select_related('sport', 'batch').all()
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAdminOrReadOnly]


class FeeViewSet(viewsets.ModelViewSet):
    queryset = Fee.objects.select_related('athlete', 'fee_structure').all()
    serializer_class = FeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_athlete:
            return self.queryset.filter(athlete=user)
        elif user.is_coach:
            return self.queryset.filter(athlete__athlete_profile__batch__coach=user)
        return self.queryset

    def perform_create(self, serializer):
        if not self.request.user.is_admin:
            raise PermissionDenied("Only admins can create fee records.")
        
        fee = serializer.save()
        
        # Notify the athlete
        Notification.objects.create(
            user=fee.athlete,
            title="New Fee Assignment",
            message=f"A new fee of {fee.amount} has been assigned to you. Due date: {fee.due_date}",
            link="/fees"
        )

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def assign_to_batch(self, request):
        """Assign a fee structure to all athletes in a batch"""
        batch_id = request.data.get('batch_id')
        fee_structure_id = request.data.get('fee_structure_id')
        due_date = request.data.get('due_date')

        if not all([batch_id, fee_structure_id, due_date]):
            return Response(
                {'error': 'batch_id, fee_structure_id, and due_date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            batch = Batch.objects.get(pk=batch_id)
            structure = FeeStructure.objects.get(pk=fee_structure_id)
        except (Batch.DoesNotExist, FeeStructure.DoesNotExist):
            return Response({'error': 'Batch or Fee Structure not found'}, status=status.HTTP_404_NOT_FOUND)

        athletes = AthleteProfile.objects.filter(batch=batch, is_active=True)
        fees_to_create = []
        notifications = []

        for athlete in athletes:
            fees_to_create.append(Fee(
                athlete=athlete.user,
                fee_structure=structure,
                amount=structure.amount,
                due_date=due_date,
                description=structure.description
            ))
            notifications.append(Notification(
                user=athlete.user,
                title="New Fee Assignment",
                message=f"A new fee of {structure.amount} for {batch.name} has been assigned to you. Due date: {due_date}",
                link="/fees"
            ))

        try:
            Fee.objects.bulk_create(fees_to_create)
            Notification.objects.bulk_create(notifications)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': f'Successfully assigned fees to {len(fees_to_create)} athletes'})


class SportViewSet(viewsets.ModelViewSet):
    queryset = Sport.objects.all()
    serializer_class = SportSerializer
    permission_classes = [IsAdminOrReadOnly]


class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.select_related('sport', 'coach').all()
    serializer_class = BatchSerializer
    permission_classes = [IsAdminOrCoachOwner]

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset
        if user.is_authenticated and not user.is_admin and user.is_coach:
            queryset = queryset.filter(coach=user)
        return queryset
    
    def paginate_queryset(self, queryset):
        if 'nopagination' in self.request.query_params:
            return None
        return super().paginate_queryset(queryset)
    
    @action(detail=True, methods=['get'])
    def athletes(self, request, pk=None):
        """Get all athletes in a batch"""
        batch = self.get_object()
        athletes = batch.athletes.select_related('user').all()
        serializer = AthleteProfileSerializer(athletes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_athletes(self, request, pk=None):
        """Add athletes to this batch"""
        batch = self.get_object()
        # Only Admins can assign athletes to batches
        if not request.user.is_admin:
            raise PermissionDenied("Only administrators can assign athletes to batches.")
            
        athlete_ids = request.data.get('athlete_ids', [])
        if not isinstance(athlete_ids, list):
            return Response({'error': 'athlete_ids must be a list'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Update the batch for the provided athlete profiles
        athletes = AthleteProfile.objects.filter(id__in=athlete_ids)
        updated_count = athletes.update(batch=batch)
        
        return Response({'message': f'Successfully added {updated_count} athletes to {batch.name}'})


class AthleteProfileViewSet(viewsets.ModelViewSet):
    queryset = AthleteProfile.objects.select_related('user', 'batch').all()
    serializer_class = AthleteProfileSerializer
    permission_classes = [IsAdminOrCoachOwner]
    filter_backends = [filters.SearchFilter]
    search_fields = ['user__first_name', 'user__last_name', 'user__username']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            # Admin can see all
            queryset = self.queryset
        elif user.is_coach:
            # Coach can only see athletes in their batches
            queryset = self.queryset.filter(batch__coach=user)
        else:
            # Athletes can only see their own profile
            queryset = self.queryset.filter(user=user)

        # Filter by user_id
        user_id = self.request.query_params.get('user')
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        # Filter by batch_id
        batch_id = self.request.query_params.get('batch')
        if batch_id:
            queryset = queryset.filter(batch_id=batch_id)

        return queryset

    def paginate_queryset(self, queryset):
        if 'nopagination' in self.request.query_params:
            return None
        return super().paginate_queryset(queryset)

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        """Get or update current user's athlete profile"""
        try:
            profile = self.get_queryset().get(user=request.user)
        except AthleteProfile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
            
        # For PATCH, we restrict fields for non-admins
        data = request.data.copy()
        if not request.user.is_admin:
            # Restricted fields for athletes
            restricted_fields = ['batch', 'is_active', 'enrollment_date']
            for field in restricted_fields:
                data.pop(field, None)
        
        serializer = self.get_serializer(profile, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CoachProfileViewSet(viewsets.ModelViewSet):
    queryset = CoachProfile.objects.select_related('user').all()
    serializer_class = CoachProfileSerializer
    permission_classes = [IsAdminOrCoachOwner]

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        """Get or update current user's coach profile"""
        try:
            profile = CoachProfile.objects.select_related('user').get(user=request.user)
        except CoachProfile.DoesNotExist:
            return Response({"error": "Coach profile not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
            
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.select_related('batch').all()
    serializer_class = ScheduleSerializer
    permission_classes = [IsAdminOrCoachOwner]
    filter_backends = [filters.SearchFilter]
    search_fields = ['batch__name', 'activity']
    
    def perform_create(self, serializer):
        # Coaches can only schedule for their own batches
        batch = serializer.validated_data.get('batch')
        
        is_owner = self.request.user.is_admin or batch.coach == self.request.user
                   
        if not is_owner:
            raise PermissionDenied("You can only schedule sessions for your assigned batches.")
        
        schedule = serializer.save()
        
        # Notify athletes in the batch
        self.create_notifications(schedule, f"New training session scheduled for {schedule.date}")

        # Automatically notify the assigned coach if an Admin created this session
        if self.request.user.is_admin and batch.coach:
            time_formatted = schedule.start_time.strftime("%I:%M %p").lstrip("0")
            date_formatted = schedule.date.strftime("%B %d")
            
            Notification.objects.create(
                user=batch.coach,
                title="New Training Session Assigned",
                message=f"You have a new session scheduled\nBatch: {batch.name}\nDate: {date_formatted}\nTime: {time_formatted}",
                link="/schedules"
            )

    def perform_update(self, serializer):
        schedule = serializer.save()
        message = f"Training session for {schedule.date} has been updated"
        if schedule.is_cancelled:
            message = f"Training session for {schedule.date} has been CANCELLED"
            
        self.create_notifications(schedule, message)

        # Automatically notify the assigned coach if an Admin updated/cancelled this session
        if self.request.user.is_admin and schedule.batch.coach:
            Notification.objects.create(
                user=schedule.batch.coach,
                title="Training Session Update",
                message=message,
                link="/schedules"
            )

    def create_notifications(self, schedule, message):
        athletes = AthleteProfile.objects.filter(batch=schedule.batch, is_active=True)
        notifications = [
            Notification(
                user=athlete.user,
                title="Training Update",
                message=message,
                link="/schedules"
            )
            for athlete in athletes
        ]
        Notification.objects.bulk_create(notifications)
    
    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset

        if user.is_authenticated and not user.is_admin:
            if user.role == 'COACH':
                queryset = queryset.filter(Q(batch__coach=user) | Q(coach=user)).distinct()
            elif user.role == 'ATHLETE':
                queryset = queryset.filter(batch__athletes__user=user)
        
        # Filter by batch if provided
        batch_id = self.request.query_params.get('batch')
        if batch_id:
            queryset = queryset.filter(batch_id=batch_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        return queryset


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('schedule', 'athlete').all()
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset
        
        if user.is_athlete:
            queryset = queryset.filter(athlete=user)
        elif user.is_coach:
            queryset = queryset.filter(schedule__batch__coach=user)
        
        # Filter by athlete
        athlete_id = self.request.query_params.get('athlete')
        if athlete_id:
            queryset = queryset.filter(athlete_id=athlete_id)
        
        # Filter by schedule
        schedule_id = self.request.query_params.get('schedule')
        if schedule_id:
            queryset = queryset.filter(schedule_id=schedule_id)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get attendance statistics for an athlete"""
        athlete_id = request.query_params.get('athlete_id', request.user.id)
        
        # Security check for coaches looking at someone else's stats
        if not request.user.is_admin and str(athlete_id) != str(request.user.id):
             if not AthleteProfile.objects.filter(user_id=athlete_id, batch__coach=request.user).exists():
                 raise PermissionDenied("You do not have permission to view statistics for this athlete.")

        attendances = Attendance.objects.filter(athlete_id=athlete_id, schedule__is_cancelled=False)
        
        # Get true scheduled session count for the athlete's assigned batch
        athlete_profile = AthleteProfile.objects.filter(user_id=athlete_id).first()
        total_scheduled = 0
        if athlete_profile and athlete_profile.batch:
             total_scheduled = Schedule.objects.filter(batch=athlete_profile.batch, is_cancelled=False, is_completed=False).count()
        
        total = attendances.count()
        present = attendances.filter(status='PRESENT').count()
        absent = attendances.filter(status='ABSENT').count()
        late = attendances.filter(status='LATE').count()
        excused = attendances.filter(status='EXCUSED').count()
        
        percentage = (present / total * 100) if total > 0 else 0
        
        data = {
            'total_sessions': total_scheduled, # Using real scheduled count for active dashboard metrics
            'present': present,
            'absent': absent,
            'late': late,
            'excused': excused,
            'attendance_percentage': float(f"{percentage:.2f}")
        }
        
        serializer = AttendanceStatsSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_mark(self, request):
        """Bulk mark attendance for a schedule"""
        schedule_id = request.data.get('schedule_id')
        attendances_data = request.data.get('attendances', [])
        
        if not schedule_id:
            return Response(
                {'error': 'schedule_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_attendances = []
        for att_data in attendances_data:
            attendance, created = Attendance.objects.update_or_create(
                schedule_id=schedule_id,
                athlete_id=att_data['athlete_id'],
                defaults={'status': att_data.get('status', 'PRESENT')}
            )
            created_attendances.append(attendance)
        
        serializer = AttendanceSerializer(created_attendances, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def batch_report(self, request):
        """Get per-athlete attendance stats for a specific batch (Admin/Coach)."""
        batch_id = request.query_params.get('batch_id')
        if not batch_id:
            return Response({'error': 'batch_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            batch = Batch.objects.select_related('sport').get(pk=batch_id)
        except Batch.DoesNotExist:
            return Response({'error': 'Batch not found'}, status=status.HTTP_404_NOT_FOUND)

        # Coach restriction check
        if not request.user.is_admin and batch.coach != request.user:
            raise PermissionDenied("You do not have permission to view reports for this batch.")

        athletes = AthleteProfile.objects.filter(batch=batch).select_related('user')
        total_sessions = Schedule.objects.filter(batch=batch, is_cancelled=False).count()

        report = []
        for athlete in athletes:
            attendances = Attendance.objects.filter(schedule__batch=batch, athlete=athlete.user)
            present = attendances.filter(status='PRESENT').count()
            absent = attendances.filter(status='ABSENT').count()
            late = attendances.filter(status='LATE').count()
            total = attendances.count()
            rate = float(f"{(present / total * 100):.1f}") if total > 0 else 0
            report.append({
                'athlete_id': athlete.user.id,
                'athlete_name': athlete.user.get_full_name() or athlete.user.username,
                'total_sessions': total_sessions,
                'attended': total,
                'present': present,
                'absent': absent,
                'late': late,
                'attendance_rate': rate,
            })

        return Response({
            'batch_id': batch.id,
            'batch_name': batch.name,
            'sport_name': batch.sport.name if batch.sport else '',
            'total_sessions': total_sessions,
            'athletes': report,
        })

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get attendance summary across assigned batches (Admin/Coach), including top/bottom performers."""
        user = request.user
        batch_id = request.query_params.get('batch_id')

        if not (user.is_admin or user.is_coach):
            return Response({'error': 'Admin or Coach access required'}, status=status.HTTP_403_FORBIDDEN)

        batches = Batch.objects.select_related('sport', 'coach').all()
        if user.is_coach:
            batches = batches.filter(coach=user)
        
        if batch_id:
            batches = batches.filter(id=batch_id)
            
        batch_summaries = []
        total_sessions_global = 0
        total_present_global = 0
        total_records_global = 0

        # Batch-level aggregation
        for batch in batches:
            sessions = Schedule.objects.filter(batch=batch, is_cancelled=False, is_completed=False).count()
            records = Attendance.objects.filter(schedule__batch=batch)
            present_count = records.filter(status='PRESENT').count()
            total_count = records.count()
            rate = float(f"{(present_count / total_count * 100):.1f}") if total_count > 0 else 0

            total_sessions_global += sessions
            total_present_global += present_count
            total_records_global += total_count

            batch_summaries.append({
                'batch_id': batch.id,
                'batch_name': batch.name,
                'sport_name': batch.sport.name if batch.sport else '',
                'coach_name': batch.coach.get_full_name() if batch.coach else 'Unassigned',
                'session_type': batch.session_type,
                'total_sessions': sessions,
                'total_records': total_count,
                'present': present_count,
                'attendance_rate': rate,
            })
        overall_rate = float(f"{(total_present_global / total_records_global * 100):.1f}") if total_records_global > 0 else 0
        sorted_batches = sorted(batch_summaries, key=lambda x: x['attendance_rate'], reverse=True)

        # Athlete-level aggregation across all selected batches
        # We only include athletes who are CURRENTLY assigned to one of the batches being summarized
        current_athlete_ids = AthleteProfile.objects.filter(batch__in=batches).values_list('user_id', flat=True)

        athlete_records = Attendance.objects.filter(
            schedule__batch__in=batches,
            athlete_id__in=current_athlete_ids
        ).values(
            'athlete__id',
            'athlete__first_name',
            'athlete__last_name'
        ).annotate(
            total=Count('id'),
            present=Count('id', filter=Q(status='PRESENT'))
        )

        athlete_stats = []
        for a in athlete_records:
            if a['total'] > 0:
                rate = float(f"{(a['present'] / a['total'] * 100):.1f}")
                athlete_stats.append({
                    'athlete_id': a['athlete__id'],
                    'athlete_name': f"{a['athlete__first_name']} {a['athlete__last_name']}".strip() or "Unknown",
                    'attendance_rate': rate,
                    'total_sessions': a['total'],
                    'present': a['present']
                })

        sorted_athletes = sorted(athlete_stats, key=lambda x: x['attendance_rate'], reverse=True)
        top_athlete = sorted_athletes[0] if sorted_athletes else None
        bottom_athlete = sorted_athletes[-1] if len(sorted_athletes) > 1 else None

        return Response({
            'total_batches': len(batch_summaries),
            'total_sessions': total_sessions_global,
            'overall_attendance_rate': overall_rate,
            'batches': sorted_batches,
            'top_athlete': top_athlete,
            'bottom_athlete': bottom_athlete,
            'is_filtered': bool(batch_id)
        })

    @action(detail=False, methods=['get'])
    def export_attendance_csv(self, request):
        """Export attendance data as CSV (Backend-driven for Excel compatibility)."""
        batch_id = request.query_params.get('batch_id')
        user = request.user

        response = HttpResponse(content_type='text/csv')
        # UTF-8 BOM for Excel on Windows
        response.write('\ufeff'.encode('utf8'))

        if batch_id:
            # Detailed Per-Batch Report
            try:
                batch = Batch.objects.select_related('sport').get(pk=batch_id)
                if not user.is_admin and batch.coach != user:
                    raise PermissionDenied("Access denied.")
                
                filename = f"attendance_{batch.name.lower().replace(' ', '_')}_{timezone.now().strftime('%Y-%m-%d')}.csv"
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                
                writer = csv.writer(response)
                writer.writerow([f"Batch: {batch.name}", "", "", "", "", ""])
                writer.writerow([f"Sport: {batch.sport.name if batch.sport else 'N/A'}", "", "", "", "", ""])
                writer.writerow([])
                writer.writerow(['Athlete Name', 'Total Sessions', 'Attended', 'Present', 'Absent', 'Late', 'Attendance Rate (%)'])

                athletes = AthleteProfile.objects.filter(batch=batch).select_related('user')
                total_sessions = Schedule.objects.filter(batch=batch, is_cancelled=False).count()

                for athlete in athletes:
                    attendances = Attendance.objects.filter(schedule__batch=batch, athlete=athlete.user)
                    present = attendances.filter(status='PRESENT').count()
                    absent = attendances.filter(status='ABSENT').count()
                    late = attendances.filter(status='LATE').count()
                    total = attendances.count()
                    rate = f"{(present/total*100):.1f}" if total > 0 else "0.0"
                    
                    writer.writerow([
                        athlete.user.get_full_name() or athlete.user.username,
                        total_sessions,
                        total,
                        present,
                        absent,
                        late,
                        rate
                    ])
                
                writer.writerow([])
                writer.writerow(['Report Generated', timezone.now().strftime('%Y-%m-%d %H:%M:%S')])

            except Batch.DoesNotExist:
                return HttpResponse(status=status.HTTP_404_NOT_FOUND)
        else:
            # All Batches Summary Report
            if not user.is_admin and not user.is_coach:
                raise PermissionDenied("Access denied.")
            
            filename = f"attendance_all_batches_{timezone.now().strftime('%Y-%m-%d')}.csv"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            writer = csv.writer(response)
            writer.writerow(['Batch Name', 'Sport', 'Coach', 'Total Sessions', 'Attendance Rate (%)'])
            
            batches = Batch.objects.select_related('sport', 'coach').all()
            if user.is_coach:
                batches = batches.filter(coach=user)
                
            for b in batches:
                records = Attendance.objects.filter(schedule__batch=b)
                present = records.filter(status='PRESENT').count()
                total = records.count()
                rate = f"{(present/total*100):.1f}" if total > 0 else "0.0"
                sessions = Schedule.objects.filter(batch=b, is_cancelled=False).count()
                
                writer.writerow([
                    b.name,
                    b.sport.name if b.sport else 'N/A',
                    b.coach.get_full_name() if b.coach else 'Unassigned',
                    sessions,
                    rate
                ])
            
            writer.writerow([])
            writer.writerow(['Generated', timezone.now().strftime('%Y-%m-%d %H:%M:%S')])

        return response


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all marked as read'})

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.select_related('batch', 'coach', 'target_coach', 'created_by').all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAdminOrCoachOwner]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return self.queryset.none()

        if user.is_admin:
            return self.queryset

        if user.is_coach:
            # Coaches see:
            # 1. Coach-targeted announcements addressed to them (or all coaches)
            # 2. Athlete/ALL batch announcements for their batches
            # 3. Global athlete/ALL announcements they posted
            coach_announcements = Q(target_audience='COACHES') & (
                Q(target_coach=user) | Q(target_coach__isnull=True)
            )
            their_batch_announcements = Q(
                batch__coach=user,
                target_audience__in=['ATHLETES', 'ALL']
            )
            their_own = Q(coach=user)
            return self.queryset.filter(
                coach_announcements | their_batch_announcements | their_own
            ).distinct()

        if user.is_athlete:
            # Athletes see athlete/ALL announcements for their batch or global
            return self.queryset.filter(
                target_audience__in=['ATHLETES', 'ALL']
            ).filter(
                Q(batch__athletes__user=user) | Q(batch__isnull=True)
            ).distinct()

        return self.queryset

    def perform_create(self, serializer):
        user = self.request.user
        # For coaches creating announcements, set the coach field
        if user.is_coach:
            announcement = serializer.save(coach=user, created_by=user)
        else:
            # Admin creating announcement
            announcement = serializer.save(created_by=user)

        # Build notifications
        notifications = []

        if announcement.target_audience in ['ATHLETES', 'ALL']:
            # Notify athletes
            if announcement.batch:
                recipient_profiles = AthleteProfile.objects.filter(
                    batch=announcement.batch, is_active=True
                )
            else:
                recipient_profiles = AthleteProfile.objects.filter(is_active=True)
            for profile in recipient_profiles:
                notifications.append(Notification(
                    user=profile.user,
                    title=f"New Announcement: {announcement.title}",
                    message=announcement.content[:100] + ("..." if len(announcement.content) > 100 else ""),
                    link="/announcements"
                ))

        if announcement.target_audience in ['COACHES', 'ALL']:
            # Notify coaches
            User = get_user_model()
            if announcement.target_coach:
                coach_users = User.objects.filter(pk=announcement.target_coach.pk)
            else:
                coach_users = User.objects.filter(role='COACH', is_active=True)
            for coach_user in coach_users:
                notifications.append(Notification(
                    user=coach_user,
                    title=f"Admin Update: {announcement.title}",
                    message=announcement.content[:100] + ("..." if len(announcement.content) > 100 else ""),
                    link="/announcements"
                ))

        if notifications:
            Notification.objects.bulk_create(notifications)

    @action(detail=False, methods=['get'])
    def coaches_list(self, request):
        """Return list of coaches for the admin announcement form dropdown."""
        if not request.user.is_admin:
            raise PermissionDenied("Only admins can access the coaches list.")
        User = get_user_model()
        coaches = User.objects.filter(role='COACH', is_active=True).values('id', 'first_name', 'last_name', 'username')
        return Response(list(coaches))


class AthleteFeedbackViewSet(viewsets.ModelViewSet):
    queryset = AthleteFeedback.objects.select_related('athlete', 'coach').all()
    serializer_class = AthleteFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        athlete_id = self.request.query_params.get('athlete') or self.request.query_params.get('athlete_id')
        
        if user.is_athlete:
            return self.queryset.filter(athlete=user)
        elif user.is_coach:
            qs = self.queryset.filter(coach=user)
            if athlete_id:
                qs = qs.filter(athlete_id=athlete_id)
            return qs
        return self.queryset

    def perform_create(self, serializer):
        feedback = serializer.save(coach=self.request.user)
        
        # Notify the athlete
        title = "New Training Instruction" if feedback.is_training_instruction else "New Feedback from Coach"
        Notification.objects.create(
            user=feedback.athlete,
            title=title,
            message=feedback.content[:100] + "...",
            link="/notifications"
        )
