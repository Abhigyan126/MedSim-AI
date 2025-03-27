# MedSim-AI
### AI-Powered symptom simulator and diagnostic trainer for medical students
## Problem Statement
Medical students lack hands-on, interactive diagnostic experience in early training.
## Features
* AI-simulated virtual patients with real-time symptom interactions
* Adaptive case-based medical questioning assistant
* AI-generated diagnostic decision tree training
* API for integrating real medical cases into virtual training<br>

💻 Tech Stack: 

- Flask
- React
- JWT
- mongoDB
- Bcrypt

## how to run 

### frontend

``` bash
git clone https://github.com/Abhigyan126/MedSim-AI.git
cd MedSim-AI
cd src/front/medsim-ai-front/
npm start
```

### backend

create .env in src/back/ and fill in the following credentials
```bash
mongo  = 'API key for mongodb'
secret = 'Secret key for JWR'
```
note: donot push the key in github, the .env in .gitignore will handle this automatically

``` bash
cd MedSim-AI
pip install -r requirements.txt
python src/back/main.py
```

### setup Vurtual environment

```bash
# outside the Working directory
cd ..
# to go back a directory
python -m venv 'name of environment'
# for Linux or mac os
source 'name of environment'/bin/activate
# for windows os
'name of environment'\Scripts\activate.bat
# or
. 'name of environment'\Scripts\activate
```