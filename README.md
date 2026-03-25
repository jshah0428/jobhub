# jobhub
hub for jobs - cs490 null pointers project

## get started:

open two terminals, one for the frontend and one for the backend

note: all of the instructions below are for mac users

### 1. start frontend
from project root:

```bash
cd frontend
npm install
npm start
```

this will start react app (usually at `http://localhost:3000`)

### 2) start backend
from the project root:

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload
```

this will start the api server (usually at `http://localhost:8000`)

## running tests

### frontend

```bash
cd frontend
npm install
npm test
```

### backend

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
pip install pytest
pytest
```