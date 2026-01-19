## Contract Management Platform

### Overview

This project is a full-stack Contract Management Platform built as part of an assignment to demonstrate backend architecture, API design, frontend integration, and controlled workflow enforcement.

#### The platform allows users to:

* Create reusable Blueprints (contract templates)

* Generate Contracts from blueprints

* Manage contracts through a strict lifecycle

* View and manage contracts via a dashboard UI

### Tech Stack

**Backend**

* Django
* Django REST Framework (DRF)
* SQLite (for simplicity)


**Frontend**

* React
* Axios for API communication


### Setup Instructions

**Backend Setup (Django)**

* Clone the repository:

```
git clone https://github.com/rishee10/Contract-Managment.git
```


```
cd contract-management
```



**Create and activate virtual environment:**

```
python -m venv venv
```

* Windows

```
venv\Scripts\activate
```

 Mac/Linux

```
source venv/bin/activate
```

**Install dependencies:**

```
pip install -r requirements.txt
```

**Run database migrations:**

```
cd backend
```

```
python manage.py makemigrations
```

```
python manage.py migrate
```

**Start backend server:**

```
python manage.py runserver
```

**Backend will run at:**

```
http://127.0.0.1:8000/
```

**Frontend Setup (React)**

**Open New Terminal Navigate to frontend directory:**


```
cd frontend
```


**Install dependencies:**


```
npm install
```

* Start frontend:

```
npm start
```

* Frontend will run at:

```
http://localhost:3000/
```


### Architecture Overview

**High-Level Architecture**

```
React Frontend

     |
     
     |  REST APIs (JSON)
     
     |
     
Django REST Framework

     |
     
     |
     
Database (SQLite)
```

**Key Design Decisions**

* Clean separation between frontend and backend

* Backend handles business logic and lifecycle enforcement

* Frontend focuses on UI and user interaction

* RESTful APIs for all data operations


### Data Model Overview

**Blueprint**

* Represents a reusable contract template

* Contains configurable fields

**BlueprintField**

* Field type (text, date, signature, checkbox)

* Label

* Position (x, y)

**Contract**

* Created from a blueprint

* Has a lifecycle status

* Stores current state

**ContractField**

* Individual fields copied from blueprint

* Stores entered values


### Contract Lifecycle

The contract lifecycle is strictly enforced on the backend:

```
CREATED → APPROVED → SENT → SIGNED → LOCKED

           ↓                ↓
           
        REVOKED          REVOKED

```
**Rules**

* Invalid transitions are rejected by API

* LOCKED contracts are immutable

* REVOKED contracts cannot move forward

* Lifecycle logic is centralized in backend services


### Assumptions

* Authentication is not implemented (mocked / omitted)
* Single-user system
* SQLite used for simplicity and quick setup
