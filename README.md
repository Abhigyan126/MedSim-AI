# MedSim-AI

An AI-driven medical simulation website that trains healthcare professionals through interactive patient encounters, diagnostic evaluation, symptom analysis, and decision-tree exercises.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [How It Works](#how-it-works)
4. [How To Run](#how-to-run)
5. [User Guide](#user-guide)

## Overview

MedSim-AI simulates realistic clinical scenarios using Large Language Models (LLMs) and machine learning. Learners can:

- Conduct patient interviews in natural language  
- Receive AI-generated symptom profiles and histories  
- Submit diagnoses and receive structured feedback  
- Navigate interactive decision trees for differential diagnosis  

## Features

- **Virtual Patient Chat**  
  - LLM-powered responses with configurable patient profiles

- **Diagnostic Evaluator**  
  - Scoring on medical knowledge, communication, presentation  

- **Synthetic Symptom Generator**  
  - Randomized or disease-specific symptom sets  

- **Decision-Tree Module**  
  - Branching logic guided by user inputs 

- **Semantic Symptom Matching**  
  - Symptom–disease similarity for prediction  

## How It Works

1. **Select Scenario**  
   - Choose from preset diseases or generate random profiles  
2. **Interview Patient**  
   - Ask questions and receive detailed responses  
3. **Submit Diagnosis**  
   - Enter differential or final diagnosis  
4. **Evaluate & Learn**  
   - View graded feedback and review decision paths  

## How To Run 

### Frontend

```bash
git clone https://github.com/Abhigyan126/MedSim-AI.git
cd MedSim-AI
cd src/front/medsim-ai-front/
npm start
```

### Backend

Create .env in src/back/ and fill in the following credentials
```bash
mongo  = 'API key for mongodb'
secret = 'Secret key for JWR'
key = 'API key for gemini'
```

```bash
cd MedSim-AI
pip install -r requirements.txt
cd src/back
python main.py
```

### Setup Virtual Environment

```bash
python -m venv 'name of environment'
# for Linux or mac os
source 'name of environment'/bin/activate
# for windows os
'name of environment'\Scripts\activate
```

## User Guide

### Virtual Patient Simulator
- Generate random or specific diseases with customizable patient profiles
  ![image](https://github.com/user-attachments/assets/ece1d670-e335-48d9-8146-fd87764676a4)
- View symptoms on human anatomy diagram
  ![image](https://github.com/user-attachments/assets/a9808226-503d-43af-a602-1c85f384408d)
- Ask questions through chat interface
  ![image](https://github.com/user-attachments/assets/6b577a30-b910-4672-93a5-7588076f2afd)
- Submit and receive feedback on diagnoses
  

### Diagnostic Evaluator
- Submit diagnosis and rationale
- Receive feedback on medical competency, communication, and presentation
  ![image](https://github.com/user-attachments/assets/e49d407c-a53a-46a1-9912-a4a2f7d4284f)

### Decision-Tree Explorer
- Answer yes/no questions for guided diagnosis
- Navigate decision paths with backtracking capability
  ![image](https://github.com/user-attachments/assets/b9e07feb-6103-41b7-ad67-a5f0a0d097ac)

### DiseaseCraft
- Match symptoms to target diseases
- Drag and drop interface with instant scoring feedback
  ![image](https://github.com/user-attachments/assets/98126a1f-0152-4caa-a4fc-15f29a670991)
