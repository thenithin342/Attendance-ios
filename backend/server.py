from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="IIITDM AttendanceSync API", version="2.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# User Models
class UserRole(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    role: str  # "student" or "faculty"
    full_name: str
    batch: Optional[str] = None  # Only for students
    department: Optional[str] = None  # Only for faculty
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str
    batch: Optional[str] = None
    department: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class Batch(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str
    students: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Hall(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str
    mac_address: str
    beacon_major: Optional[int] = None
    beacon_minor: Optional[int] = None
    capacity: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AttendanceWindow(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    hall_id: str
    batch_id: str
    start_time: datetime
    end_time: datetime
    is_active: bool = True
    created_by: str  # faculty_id
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AttendanceRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    hall_id: str
    batch_id: str
    attendance_window_id: str
    marked_at: datetime = Field(default_factory=datetime.utcnow)
    verification_method: str  # "face_recognition", "manual", etc.
    beacon_rssi: Optional[int] = None
    face_confidence: Optional[float] = None

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        token_data = {"email": email}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_current_faculty(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "faculty":
        raise HTTPException(status_code=403, detail="Faculty access required")
    return current_user

# Authentication endpoints
@api_router.post("/auth/register", response_model=Token)
async def register(user: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate email domain for IIITDM
    if not user.email.endswith("@iiitdm.ac.in"):
        raise HTTPException(status_code=400, detail="Only @iiitdm.ac.in email addresses are allowed")
    
    # Create user
    hashed_password = get_password_hash(user.password)
    user_data = UserRole(
        email=user.email,
        role=user.role,
        full_name=user.full_name,
        batch=user.batch,
        department=user.department
    )
    user_dict = user_data.dict()
    user_dict["hashed_password"] = hashed_password
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name,
            "batch": user.batch,
            "department": user.department
        }
    }

@api_router.post("/auth/login", response_model=Token)
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": db_user["email"],
            "role": db_user["role"],
            "full_name": db_user["full_name"],
            "batch": db_user.get("batch"),
            "department": db_user.get("department")
        }
    }

@api_router.get("/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return {
        "email": current_user["email"],
        "role": current_user["role"],
        "full_name": current_user["full_name"],
        "batch": current_user.get("batch"),
        "department": current_user.get("department")
    }

# Admin endpoints (Faculty only)
@api_router.get("/admin/batches", response_model=List[Batch])
async def get_batches(current_user: dict = Depends(get_current_faculty)):
    batches = await db.batches.find().to_list(1000)
    return [Batch(**batch) for batch in batches]

@api_router.post("/admin/batches", response_model=Batch)
async def create_batch(batch: Batch, current_user: dict = Depends(get_current_faculty)):
    batch_dict = batch.dict()
    await db.batches.insert_one(batch_dict)
    return batch

@api_router.get("/admin/halls", response_model=List[Hall])
async def get_halls(current_user: dict = Depends(get_current_faculty)):
    halls = await db.halls.find().to_list(1000)
    return [Hall(**hall) for hall in halls]

@api_router.post("/admin/halls", response_model=Hall)
async def create_hall(hall: Hall, current_user: dict = Depends(get_current_faculty)):
    hall_dict = hall.dict()
    await db.halls.insert_one(hall_dict)
    return hall

@api_router.get("/admin/students")
async def get_students_by_batch(batch_id: str, current_user: dict = Depends(get_current_faculty)):
    students = await db.users.find({"role": "student", "batch": batch_id}).to_list(1000)
    return [{"email": s["email"], "full_name": s["full_name"], "batch": s["batch"]} for s in students]

@api_router.get("/admin/attendance/today")
async def get_today_attendance(current_user: dict = Depends(get_current_faculty)):
    today = datetime.now().date()
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())
    
    attendance = await db.attendance_records.find({
        "marked_at": {"$gte": start_of_day, "$lte": end_of_day}
    }).to_list(1000)
    
    return attendance

@api_router.post("/admin/attendance-window")
async def create_attendance_window(window: AttendanceWindow, current_user: dict = Depends(get_current_faculty)):
    window_dict = window.dict()
    window_dict["created_by"] = current_user["id"]
    await db.attendance_windows.insert_one(window_dict)
    return window

# Student endpoints
@api_router.get("/student/attendance-windows")
async def get_active_attendance_windows(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Student access required")
    
    now = datetime.utcnow()
    windows = await db.attendance_windows.find({
        "batch_id": current_user["batch"],
        "start_time": {"$lte": now},
        "end_time": {"$gte": now},
        "is_active": True
    }).to_list(1000)
    
    return windows

@api_router.post("/student/mark-attendance")
async def mark_attendance(
    hall_id: str,
    attendance_window_id: str,
    verification_method: str = "face_recognition",
    beacon_rssi: Optional[int] = None,
    face_confidence: Optional[float] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Student access required")
    
    # Check if attendance window is active
    window = await db.attendance_windows.find_one({
        "id": attendance_window_id,
        "is_active": True,
        "start_time": {"$lte": datetime.utcnow()},
        "end_time": {"$gte": datetime.utcnow()}
    })
    
    if not window:
        raise HTTPException(status_code=400, detail="Attendance window not active")
    
    # Check if already marked
    existing = await db.attendance_records.find_one({
        "student_id": current_user["id"],
        "attendance_window_id": attendance_window_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Attendance already marked")
    
    # Create attendance record
    record = AttendanceRecord(
        student_id=current_user["id"],
        hall_id=hall_id,
        batch_id=current_user["batch"],
        attendance_window_id=attendance_window_id,
        verification_method=verification_method,
        beacon_rssi=beacon_rssi,
        face_confidence=face_confidence
    )
    
    await db.attendance_records.insert_one(record.dict())
    
    return {"message": "Attendance marked successfully", "record": record}

# Legacy endpoints
@api_router.get("/")
async def root():
    return {"message": "IIITDM AttendanceSync API v2.0"}

@api_router.post("/status")
async def create_status_check(current_user: dict = Depends(get_current_user)):
    status_dict = {
        "id": str(uuid.uuid4()),
        "client_name": current_user["email"],
        "timestamp": datetime.utcnow()
    }
    await db.status_checks.insert_one(status_dict)
    return status_dict

@api_router.get("/status")
async def get_status_checks(current_user: dict = Depends(get_current_user)):
    status_checks = await db.status_checks.find().to_list(1000)
    return status_checks

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
