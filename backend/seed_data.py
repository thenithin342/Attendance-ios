#!/usr/bin/env python3
"""
Seed script to populate IIITDM AttendanceSync database with sample data
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timedelta
from passlib.context import CryptContext

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# Database connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

async def seed_database():
    """Seed the database with sample data"""
    
    print("🌱 Seeding IIITDM AttendanceSync database...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.batches.delete_many({})
    await db.halls.delete_many({})
    await db.attendance_windows.delete_many({})
    await db.attendance_records.delete_many({})
    print("✅ Cleared existing data")
    
    # Create batches
    batches = [
        {
            "id": "batch-a",
            "name": "Batch A",
            "code": "BA2025",
            "students": [],
            "created_at": datetime.utcnow()
        },
        {
            "id": "batch-b",
            "name": "Batch B",
            "code": "BB2025",
            "students": [],
            "created_at": datetime.utcnow()
        },
        {
            "id": "batch-c",
            "name": "Batch C",
            "code": "BC2025",
            "students": [],
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.batches.insert_many(batches)
    print("✅ Created batches")
    
    # Create halls
    halls = [
        {
            "id": "hall-101",
            "name": "Hall 101",
            "code": "H101",
            "mac_address": "AA:BB:CC:DD:EE:01",
            "beacon_major": 101,
            "beacon_minor": 1,
            "capacity": 60,
            "created_at": datetime.utcnow()
        },
        {
            "id": "hall-102",
            "name": "Hall 102",
            "code": "H102",
            "mac_address": "AA:BB:CC:DD:EE:02",
            "beacon_major": 102,
            "beacon_minor": 1,
            "capacity": 80,
            "created_at": datetime.utcnow()
        },
        {
            "id": "hall-103",
            "name": "Hall 103",
            "code": "H103",
            "mac_address": "AA:BB:CC:DD:EE:03",
            "beacon_major": 103,
            "beacon_minor": 1,
            "capacity": 100,
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.halls.insert_many(halls)
    print("✅ Created halls")
    
    # Create faculty users
    faculty_users = [
        {
            "id": "faculty-1",
            "email": "dr.sharma@iiitdm.ac.in",
            "hashed_password": get_password_hash("password123"),
            "role": "faculty",
            "full_name": "Dr. Rajesh Sharma",
            "department": "Computer Science",
            "batch": None,
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": "faculty-2",
            "email": "prof.kumar@iiitdm.ac.in",
            "hashed_password": get_password_hash("password123"),
            "role": "faculty",
            "full_name": "Prof. Anita Kumar",
            "department": "Electronics",
            "batch": None,
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.users.insert_many(faculty_users)
    print("✅ Created faculty users")
    
    # Create student users
    student_users = [
        {
            "id": "student-1",
            "email": "cs23i1001@iiitdm.ac.in",
            "hashed_password": get_password_hash("password123"),
            "role": "student",
            "full_name": "Arjun Patel",
            "department": None,
            "batch": "batch-a",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": "student-2",
            "email": "cs23i1002@iiitdm.ac.in",
            "hashed_password": get_password_hash("password123"),
            "role": "student",
            "full_name": "Priya Sharma",
            "department": None,
            "batch": "batch-a",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": "student-3",
            "email": "cs23i1003@iiitdm.ac.in",
            "hashed_password": get_password_hash("password123"),
            "role": "student",
            "full_name": "Vikram Singh",
            "department": None,
            "batch": "batch-b",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": "student-4",
            "email": "cs23i1004@iiitdm.ac.in",
            "hashed_password": get_password_hash("password123"),
            "role": "student",
            "full_name": "Ananya Reddy",
            "department": None,
            "batch": "batch-b",
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.users.insert_many(student_users)
    print("✅ Created student users")
    
    # Create attendance windows
    now = datetime.utcnow()
    attendance_windows = [
        {
            "id": "window-1",
            "hall_id": "hall-101",
            "batch_id": "batch-a",
            "start_time": now - timedelta(hours=1),
            "end_time": now + timedelta(hours=2),
            "is_active": True,
            "created_by": "faculty-1",
            "created_at": now
        },
        {
            "id": "window-2",
            "hall_id": "hall-102",
            "batch_id": "batch-b",
            "start_time": now - timedelta(minutes=30),
            "end_time": now + timedelta(hours=1),
            "is_active": True,
            "created_by": "faculty-2",
            "created_at": now
        }
    ]
    
    await db.attendance_windows.insert_many(attendance_windows)
    print("✅ Created attendance windows")
    
    # Create sample attendance records
    attendance_records = [
        {
            "id": "record-1",
            "student_id": "student-1",
            "hall_id": "hall-101",
            "batch_id": "batch-a",
            "attendance_window_id": "window-1",
            "marked_at": now - timedelta(minutes=45),
            "verification_method": "face_recognition",
            "beacon_rssi": -42,
            "face_confidence": 0.97
        },
        {
            "id": "record-2",
            "student_id": "student-2",
            "hall_id": "hall-101",
            "batch_id": "batch-a",
            "attendance_window_id": "window-1",
            "marked_at": now - timedelta(minutes=40),
            "verification_method": "face_recognition",
            "beacon_rssi": -38,
            "face_confidence": 0.95
        }
    ]
    
    await db.attendance_records.insert_many(attendance_records)
    print("✅ Created attendance records")
    
    print("\n🎉 Database seeding completed successfully!")
    print("\n📋 Test Accounts Created:")
    print("👨‍🏫 Faculty Accounts:")
    print("   📧 dr.sharma@iiitdm.ac.in / password123")
    print("   📧 prof.kumar@iiitdm.ac.in / password123")
    print("\n👨‍🎓 Student Accounts:")
    print("   📧 cs23i1001@iiitdm.ac.in / password123 (Batch A)")
    print("   📧 cs23i1002@iiitdm.ac.in / password123 (Batch A)")
    print("   📧 cs23i1003@iiitdm.ac.in / password123 (Batch B)")
    print("   📧 cs23i1004@iiitdm.ac.in / password123 (Batch B)")
    print("\n🏢 Halls Created:")
    print("   🏛️ Hall 101 (MAC: AA:BB:CC:DD:EE:01)")
    print("   🏛️ Hall 102 (MAC: AA:BB:CC:DD:EE:02)")
    print("   🏛️ Hall 103 (MAC: AA:BB:CC:DD:EE:03)")
    print("\n✅ Ready to test the application!")

if __name__ == "__main__":
    asyncio.run(seed_database())