from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, Column, Integer, String, Text, Float
from sqlalchemy.orm import declarative_base, sessionmaker
from pydantic import BaseModel
from typing import Optional

DATABASE_URL = "sqlite:///./hunter.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True)
    title = Column(String(120), nullable=False)
    company = Column(String(120), nullable=False)
    location = Column(String(120), nullable=False)
    job_type = Column(String(50), default="Full-time")
    experience = Column(String(80), default="Fresher")
    salary = Column(String(80), default="Not disclosed")
    skills = Column(String(500), default="")
    description = Column(Text, default="")

class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, nullable=False)
    candidate = Column(String(120), nullable=False)
    status = Column(String(50), default="Applied")

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hunter AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JobCreate(BaseModel):
    title: str
    company: str
    location: str
    job_type: str = "Full-time"
    experience: str = "Fresher"
    salary: str = "Not disclosed"
    skills: str = ""
    description: str = ""

class ApplicationCreate(BaseModel):
    job_id: int
    candidate: str

class ResumeRequest(BaseModel):
    resume_text: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def seed_jobs(db: Session):
    if db.query(Job).count():
        return
    jobs = [
        Job(title="Junior Full Stack Developer", company="TechNova", location="Bengaluru", job_type="Full-time", experience="0-1 years", salary="₹5-8 LPA", skills="React, JavaScript, Python, SQL, REST API", description="Build user-facing web applications and backend APIs."),
        Job(title="Python Developer", company="CloudPeak", location="Remote", job_type="Full-time", experience="0-1 years", salary="₹4-7 LPA", skills="Python, FastAPI, SQL, Git", description="Develop reliable Python services and REST APIs."),
        Job(title="Frontend Developer Intern", company="InnoWorks", location="Kolkata", job_type="Internship", experience="Fresher", salary="₹15-25K/month", skills="HTML, CSS, JavaScript, React", description="Work with the product team to build responsive interfaces."),
        Job(title="Software Engineer Trainee", company="NextGrid", location="Hyderabad", job_type="Full-time", experience="Fresher", salary="₹4-6 LPA", skills="JavaScript, Python, SQL, Git", description="Join a software engineering team and learn production development."),
    ]
    db.add_all(jobs)
    db.commit()

@app.on_event("startup")
def startup():
    db = SessionLocal()
    seed_jobs(db)
    db.close()

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Hunter AI API"}

@app.get("/api/jobs")
def list_jobs(
    q: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    jobs = db.query(Job).all()
    if q:
        term = q.lower()
        jobs = [j for j in jobs if term in f"{j.title} {j.company} {j.skills}".lower()]
    if location and location.lower() != "all":
        jobs = [j for j in jobs if location.lower() in j.location.lower()]
    if job_type and job_type.lower() != "all":
        jobs = [j for j in jobs if job_type.lower() in j.job_type.lower()]
    return jobs

@app.get("/api/jobs/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    return job

@app.post("/api/jobs", status_code=201)
def create_job(payload: JobCreate, db: Session = Depends(get_db)):
    job = Job(**payload.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

@app.post("/api/applications", status_code=201)
def apply(payload: ApplicationCreate, db: Session = Depends(get_db)):
    if not db.query(Job).filter(Job.id == payload.job_id).first():
        raise HTTPException(404, "Job not found")
    application = Application(**payload.model_dump())
    db.add(application)
    db.commit()
    db.refresh(application)
    return application

@app.get("/api/applications")
def applications(candidate: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Application)
    if candidate:
        query = query.filter(Application.candidate == candidate)
    return query.all()

@app.post("/api/resume/analyze")
def analyze_resume(payload: ResumeRequest):
    text = payload.resume_text.lower()
    skills = ["python", "sql", "javascript", "react", "html", "css", "fastapi", "git", "docker", "postgresql"]
    found = [s for s in skills if s in text]
    missing = [s for s in skills[:8] if s not in found]
    score = min(100, 40 + len(found) * 7)
    recommendations = []
    if "python" in found and "sql" in found:
        recommendations.append("Python Developer")
    if "javascript" in found and "react" in found:
        recommendations.append("Frontend / React Developer")
    if "python" in found and "react" in found:
        recommendations.append("Full Stack Developer")
    if not recommendations:
        recommendations.append("Junior Software Developer")
    return {
        "score": score,
        "skills_detected": found,
        "skills_to_improve": missing[:5],
        "recommended_roles": recommendations,
        "note": "This MVP uses transparent rule-based scoring. It is not an LLM."
    }
@app.post("/api/jobs/{job_id}/match")
def match_job(
    job_id: int,
    payload: ResumeRequest,
    db: Session = Depends(get_db)
):
    text = payload.resume_text.lower()

    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job_skills = [
        skill.strip().lower()
        for skill in job.skills.split(",")
        if skill.strip()
    ]

    matched_skills = [
        skill for skill in job_skills
        if skill in text
    ]

    missing_skills = [
        skill for skill in job_skills
        if skill not in text
    ]

    if job_skills:
        match_score = round(
            (len(matched_skills) / len(job_skills)) * 100
        )
    else:
        match_score = 0

    return {
        "job_id": job.id,
        "job_title": job.title,
        "match_score": match_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "message": "Job match calculated using transparent rule-based matching."
    }