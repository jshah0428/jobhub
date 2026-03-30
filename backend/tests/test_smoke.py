from fastapi.testclient import TestClient
from main import app, JobCreate, JobUpdate

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "FastAPI running on Vercel"}


def test_list_jobs_requires_auth():
    response = client.get("/jobs")
    assert response.status_code == 401


def test_create_job_requires_auth():
    response = client.post("/jobs", json={"title": "Engineer", "company": "Acme"})
    assert response.status_code == 401


def test_get_job_requires_auth():
    response = client.get("/jobs/some-uuid")
    assert response.status_code == 401


def test_update_job_requires_auth():
    response = client.put("/jobs/some-uuid", json={"title": "Senior Engineer"})
    assert response.status_code == 401


def test_delete_job_requires_auth():
    response = client.delete("/jobs/some-uuid")
    assert response.status_code == 401


def test_job_create_schema():
    job = JobCreate(title="Engineer", company="Acme")
    assert job.title == "Engineer"
    assert job.company == "Acme"
    assert job.status == "applied"
    assert job.location is None


def test_job_update_schema_all_optional():
    job = JobUpdate()
    assert job.title is None
    assert job.company is None
    assert job.status is None


def test_job_create_full_schema():
    job = JobCreate(
        title="Backend Engineer",
        company="TechCorp",
        location="Remote",
        status="interviewing",
        description="Build APIs",
        notes="Referral from alumni",
    )
    assert job.status == "interviewing"
    assert job.location == "Remote"
