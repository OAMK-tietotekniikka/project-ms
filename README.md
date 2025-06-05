# Company-Oriented Product Development Projects Management Tool



## How to run the application
### Prerequisites
If not installed yet:
- Install Node.js (https://nodejs.org/en/download/package-manager/current) which by default includes npm (None Package Manager)
- Install Git (https://git-scm.com/downloads)
- Install Docker Desktop (https://docs.docker.com/get-started/get-docker/)

Clone the repository to your local computer, and navigate to the relevant folder:
```bash
git clone https://github.com/OAMK-tietotekniikka/ProjectsMS.git
cd ProjectsMS
```
### General modules
- Install general dev dependencies:
```bash
npm install
```

### Frontend setup
- Change directory to *frontend* folder
- Install dependencies for the frontend client:
```bash
npm install
```
### Backend setup
- Change directory to *server* folder
- Install dependencies for the backend server:
```bash
npm install
```
### Start the application
- Navigate to the ProjectMS root folder, and execute the following command:


**On windows**
```bash
docker-compose -f docker-compose.dev.yml up --build - dev environment with Docker
docker-compose up --build - production environment with Docker
```
**On unix**
```bash
make - get list of make commands
make dev-docker    - Start development environment with Docker (hot reload)
make prod-docker   - Start production environment with Docker
```
