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
- To run the application locally, navigate to the ProjectMS root folder, and execute the following command:
```bash
docker-compose up --build
```
