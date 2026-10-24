from datetime import time

from django.core.management.base import BaseCommand

from api.models import Availability, Doctor, User


DEMO_DOCTORS = [
    {
        "username": "demo.general@careline.local",
        "first_name": "Anita",
        "last_name": "Sharma",
        "specialization": "General Physician",
        "languages": ["Hindi", "English"],
        "experience_years": 8,
        "consultation_fee": 80,
        "days": range(0, 5),
        "bio": "Verified demo clinician for prototype discovery and booking. Connects patients with everyday primary care.",
    },
    {
        "username": "demo.pediatrician@careline.local",
        "first_name": "Arjun",
        "last_name": "Mehta",
        "specialization": "Pediatrician",
        "languages": ["Hindi", "English", "Marathi"],
        "experience_years": 11,
        "consultation_fee": 150,
        "days": range(1, 6),
        "bio": "Verified demo clinician for prototype discovery and booking. Focused on child and family health.",
    },
    {
        "username": "demo.mentalhealth@careline.local",
        "first_name": "Nisha",
        "last_name": "Khan",
        "specialization": "Mental Health Counselor",
        "languages": ["Hindi", "English", "Urdu"],
        "experience_years": 6,
        "consultation_fee": 200,
        "days": range(0, 5),
        "bio": "Verified demo clinician for prototype discovery and booking. Offers supportive mental health conversations.",
    },
    {
        "username": "demo.dermatologist@careline.local",
        "first_name": "Ravi",
        "last_name": "Patel",
        "specialization": "Dermatologist",
        "languages": ["Hindi", "English", "Gujarati"],
        "experience_years": 9,
        "consultation_fee": 250,
        "days": range(2, 7),
        "bio": "Verified demo clinician for prototype discovery and booking. Helps with common skin concerns.",
    },
]


class Command(BaseCommand):
    help = "Create idempotent verified demo doctors for local prototype discovery."

    def handle(self, *args, **options):
        for item in DEMO_DOCTORS:
            user, _ = User.objects.get_or_create(
                username=item["username"],
                defaults={
                    "first_name": item["first_name"],
                    "last_name": item["last_name"],
                    "email": item["username"],
                    "role": "doctor",
                    "preferred_language": item["languages"][0],
                },
            )
            user.first_name = item["first_name"]
            user.last_name = item["last_name"]
            user.role = "doctor"
            user.set_unusable_password()
            user.save()
            doctor, _ = Doctor.objects.update_or_create(
                user=user,
                defaults={
                    "specialization": item["specialization"],
                    "languages": item["languages"],
                    "experience_years": item["experience_years"],
                    "consultation_fee": item["consultation_fee"],
                    "bio": item["bio"],
                    "is_accepting_patients": True,
                },
            )
            for weekday in item["days"]:
                Availability.objects.update_or_create(
                    doctor=doctor,
                    weekday=weekday,
                    start_time=time(9),
                    end_time=time(17),
                    defaults={"slot_minutes": 30, "active": True},
                )
            self.stdout.write(self.style.SUCCESS(f"Seeded {doctor}"))
