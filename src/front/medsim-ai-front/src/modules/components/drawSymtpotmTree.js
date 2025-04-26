import { useState, useEffect } from 'react';
import * as ort from 'onnxruntime-web';

export default function DrawSymptomTree() {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [metadata, setMetadata] = useState(null);

  // Akinator state
  const [askedSymptoms, setAskedSymptoms] = useState(new Set());
  const [currentSymptoms, setCurrentSymptoms] = useState(null);
  const [yesSymptoms, setYesSymptoms] = useState([]);
  const [noSymptoms, setNoSymptoms] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [diagnosis, setDiagnosis] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [showingDiagnosis, setShowingDiagnosis] = useState(false);
  const [symptomPools, setSymptomPools] = useState(null);

  const MIN_QUESTIONS = 8;
  const MAX_QUESTIONS = 25;
  const CONFIDENCE_THRESHOLD = 0.6;

  // Load the ONNX model and metadata on component mount
  useEffect(() => {
    async function loadModel() {
      try {
        setIsLoading(true);

        // Load metadata first
        const metadataResponse = await fetch('model/medical_akinator_metadata.json');
        if (!metadataResponse.ok) {
          throw new Error('Failed to load metadata');
        }
        const metadataJson = await metadataResponse.json();
        setMetadata(metadataJson);

        // Initialize current symptoms array with zeros
        const symptomsArray = new Array(metadataJson.symptomNames.length).fill(0);
        setCurrentSymptoms(symptomsArray);

        // Initialize symptom pools for the questioning strategy
        initializeSymptomPools(metadataJson.symptomNames);

        // Load ONNX model
        const modelResponse = await fetch('model/medical_akinator_rf_model.onnx');
        if (!modelResponse.ok) {
          throw new Error('Failed to load ONNX model');
        }

        const modelArrayBuffer = await modelResponse.arrayBuffer();
        const newSession = await ort.InferenceSession.create(modelArrayBuffer);

        // Log input and output names to help with debugging
        console.log('Model input names:', newSession.inputNames);
        console.log('Model output names:', newSession.outputNames);

        setSession(newSession);
        setIsModelLoaded(true);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading model:', err);
        setError(err.message);
        setIsLoading(false);
      }
    }

    loadModel();
  }, []);

  // Initialize symptom pools for the questioning strategy
  const initializeSymptomPools = (symptomNames) => {
    // For simplicity, we'll just divide symptoms into three tiers randomly
    // In a real application, you might want to use feature importances from the model
    const shuffledSymptoms = [...symptomNames].sort(() => Math.random() - 0.5);
    const numSymptoms = symptomNames.length;

    const topCutoff = Math.min(30, Math.floor(numSymptoms / 3));
    const midCutoff = Math.min(100, Math.floor(numSymptoms * 2 / 3));

    const pools = {
      topSymptoms: shuffledSymptoms.slice(0, topCutoff),
      midSymptoms: shuffledSymptoms.slice(topCutoff, midCutoff),
      otherSymptoms: shuffledSymptoms.slice(midCutoff),
    };

    setSymptomPools(pools);
    // Ask first question after initializing pools
    askNextQuestion(pools, new Set(), 0, symptomNames);
  };

  // Ask next question
  const askNextQuestion = (pools, asked, count, allSymptoms = metadata?.symptomNames) => {
    if (!pools || !allSymptoms) return;

    // If we've asked the maximum number of questions, show diagnosis
    if (count >= MAX_QUESTIONS) {
      setGameOver(true);
      getDiagnosisWithoutInference();
      return;
    }

    // Continue asking questions
    selectNextSymptom(pools, asked, allSymptoms);
  };

  // Select the next symptom to ask about
 const selectNextSymptom = (pools, asked, allSymptoms) => {
     if (!pools || !allSymptoms) {
       console.error("Symptom pools or all symptoms list not available.");
       setGameOver(true); // Ensure game ends if essential data is missing
       getDiagnosisWithoutInference();
       return;
     }

     let symptomToAsk = null; // Variable to hold the symptom found

     // 1. Targeted questioning based on confirmed symptoms
     if (yesSymptoms.length > 0) {
       const potentialDiseases = [];
       
       // This is a simplified version of the disease-symptom map from getDiagnosisWithoutInference
       const diseaseSymptomMap = {
         "Common Cold": ["runny_nose", "congestion", "sneezing", "sore_throat", "cough", "headache", "mild_fever"],
         "Influenza": ["high_fever", "body_aches", "fatigue", "cough", "headache", "sore_throat", "chills"],
         "COVID-19": ["fever", "dry_cough", "fatigue", "loss_of_taste", "loss_of_smell", "shortness_of_breath"],
         "Gastroenteritis": ["nausea", "vomiting", "diarrhea", "abdominal_pain", "stomach_cramps", "fever"],
         "Migraine": ["severe_headache", "light_sensitivity", "sound_sensitivity", "nausea", "vomiting"],
         "Pneumonia": ["high_fever", "cough_with_phlegm", "shortness_of_breath", "chest_pain", "fatigue"],
         // Add more disease-symptom mappings as needed
       };
       
       Object.entries(diseaseSymptomMap).forEach(([disease, symptoms]) => {
         if (yesSymptoms.some(s => symptoms.includes(s))) {
           const unaskedSymptoms = symptoms.filter(s => !asked.has(s));
           if (unaskedSymptoms.length > 0) {
             potentialDiseases.push({
               disease,
               unaskedSymptoms
             });
           }
         }
       });
       
       if (potentialDiseases.length > 0) {
         const selectedDisease = potentialDiseases[Math.floor(Math.random() * potentialDiseases.length)];
         const unasked = selectedDisease.unaskedSymptoms;
         
         if (unasked.length > 0) {
           symptomToAsk = unasked[Math.floor(Math.random() * unasked.length)];
           // We found a targeted symptom, don't proceed to pool logic in this call
         }
       }
     }
     
     // 2. Fallback to general pools if no targeted symptom was found
     if (!symptomToAsk) {
       let poolOptions = [];
       
       if (questionCount < 15) {
         poolOptions = [...pools.topSymptoms];
       } else if (questionCount < 25) {
         poolOptions = [...pools.midSymptoms];
       } else {
         poolOptions = [...pools.otherSymptoms];
       }
       
       const availableSymptoms = poolOptions.filter(s => !asked.has(s));
       
       if (availableSymptoms.length > 0) {
         const shuffled = availableSymptoms.sort(() => Math.random() - 0.5);
         symptomToAsk = shuffled[0];
       } else {
         // If current pool exhausted, check all pools
         const allPoolsSymptoms = [...pools.topSymptoms, ...pools.midSymptoms, ...pools.otherSymptoms];
         const remainingSymptoms = allPoolsSymptoms.filter(s => !asked.has(s));
         
         if (remainingSymptoms.length > 0) {
           symptomToAsk = remainingSymptoms[Math.floor(Math.random() * remainingSymptoms.length)];
         }
       }
     }

     // 3. Set the current question or end the game
     if (symptomToAsk) {
       setCurrentQuestion(symptomToAsk);
     } else {
       // If no symptom was found through any method, all applicable symptoms have been asked
       console.log("All relevant symptoms exhausted. Ending game.");
       setGameOver(true);
       getDiagnosisWithoutInference();
     }
   };


  // Get diagnosis safely without risking inference errors
  const getDiagnosisWithoutInference = () => {
    // Create a more comprehensive disease-symptom mapping
    const diseaseSymptomMap = {
      "Common Cold": {
        primarySymptoms: ["runny_nose", "congestion", "sneezing", "sore_throat", "cough"],
        secondarySymptoms: ["headache", "mild_fever", "fatigue", "body_aches"],
        weight: 0.7
      },
      "Influenza": {
        primarySymptoms: ["high_fever", "body_aches", "fatigue", "cough", "headache"],
        secondarySymptoms: ["sore_throat", "runny_nose", "congestion", "chills"],
        weight: 0.8
      },
      "COVID-19": {
        primarySymptoms: ["fever", "dry_cough", "fatigue", "loss_of_taste", "loss_of_smell"],
        secondarySymptoms: ["sore_throat", "headache", "body_aches", "shortness_of_breath", "congestion"],
        weight: 0.85
      },
      "Allergic Rhinitis": {
        primarySymptoms: ["sneezing", "runny_nose", "itchy_eyes", "congestion"],
        secondarySymptoms: ["headache", "fatigue", "cough", "sore_throat"],
        weight: 0.65
      },
      "Migraine": {
        primarySymptoms: ["severe_headache", "light_sensitivity", "sound_sensitivity", "nausea"],
        secondarySymptoms: ["vomiting", "blurred_vision", "dizziness", "fatigue"],
        weight: 0.75
      },
      "Gastroenteritis": {
        primarySymptoms: ["nausea", "vomiting", "diarrhea", "abdominal_pain", "stomach_cramps"],
        secondarySymptoms: ["fever", "headache", "fatigue", "dehydration"],
        weight: 0.72
      },
      "Peptic Ulcer": {
        primarySymptoms: ["abdominal_pain", "burning_stomach_pain", "nausea"],
        secondarySymptoms: ["bloating", "heartburn", "weight_loss", "vomiting"],
        weight: 0.68
      },
      "Pneumonia": {
        primarySymptoms: ["high_fever", "cough_with_phlegm", "shortness_of_breath", "chest_pain"],
        secondarySymptoms: ["fatigue", "sweating", "chills", "headache", "confusion"],
        weight: 0.82
      },
      "Bronchitis": {
        primarySymptoms: ["persistent_cough", "mucus_production", "wheezing", "chest_discomfort"],
        secondarySymptoms: ["fatigue", "mild_fever", "shortness_of_breath", "chills"],
        weight: 0.7
      },
      "Urinary Tract Infection": {
        primarySymptoms: ["burning_urination", "frequent_urination", "urgent_urination", "cloudy_urine"],
        secondarySymptoms: ["pelvic_pain", "low_fever", "fatigue", "lower_back_pain"],
        weight: 0.75
      },
      "Hypertension": {
        primarySymptoms: ["headache", "shortness_of_breath", "nosebleeds"],
        secondarySymptoms: ["dizziness", "chest_pain", "blurred_vision", "fatigue"],
        weight: 0.6
      },
      "Type 2 Diabetes": {
        primarySymptoms: ["frequent_urination", "increased_thirst", "increased_hunger", "fatigue"],
        secondarySymptoms: ["blurred_vision", "slow_healing_wounds", "numbness_in_extremities", "weight_loss"],
        weight: 0.78
      },
      "Osteoarthritis": {
        primarySymptoms: ["joint_pain", "joint_stiffness", "reduced_mobility", "swelling"],
        secondarySymptoms: ["joint_tenderness", "grating_sensation", "bone_spurs", "fatigue"],
        weight: 0.72
      },
      "Rheumatoid Arthritis": {
        primarySymptoms: ["joint_pain", "joint_swelling", "joint_stiffness", "fatigue"],
        secondarySymptoms: ["fever", "weight_loss", "weakness", "multiple_joint_involvement"],
        weight: 0.75
      },
      "Anxiety Disorder": {
        primarySymptoms: ["excessive_worry", "restlessness", "irritability", "difficulty_concentrating"],
        secondarySymptoms: ["fatigue", "muscle_tension", "sleep_problems", "increased_heart_rate"],
        weight: 0.65
      },
      "Depression": {
        primarySymptoms: ["persistent_sadness", "loss_of_interest", "fatigue", "sleep_problems"],
        secondarySymptoms: ["difficulty_concentrating", "weight_changes", "feelings_of_guilt", "thoughts_of_death"],
        weight: 0.7
      },
      "Asthma": {
        primarySymptoms: ["wheezing", "shortness_of_breath", "chest_tightness", "coughing"],
        secondarySymptoms: ["difficulty_sleeping", "fatigue", "anxiety", "rapid_breathing"],
        weight: 0.75
      },
      "Hypothyroidism": {
        primarySymptoms: ["fatigue", "weight_gain", "cold_sensitivity", "dry_skin"],
        secondarySymptoms: ["constipation", "depression", "muscle_weakness", "joint_pain"],
        weight: 0.72
      },
      "Hyperthyroidism": {
        primarySymptoms: ["weight_loss", "rapid_heartbeat", "increased_appetite", "tremors"],
        secondarySymptoms: ["fatigue", "anxiety", "heat_sensitivity", "sleep_problems"],
        weight: 0.72
      },
      "Irritable Bowel Syndrome": {
        primarySymptoms: ["abdominal_pain", "bloating", "constipation", "diarrhea"],
        secondarySymptoms: ["gas", "mucus_in_stool", "fatigue", "food_intolerance"],
        weight: 0.68
      }
    };

    // Calculate scores for each disease based on symptom matches
    const diagnoses = [];

    Object.entries(diseaseSymptomMap).forEach(([disease, data]) => {
      const { primarySymptoms, secondarySymptoms, weight } = data;

      // Count matching symptoms
      const matchingPrimary = primarySymptoms.filter(s => yesSymptoms.includes(s));
      const matchingSecondary = secondarySymptoms.filter(s => yesSymptoms.includes(s));

      // Count conflicting symptoms (symptoms explicitly denied)
      const conflictingPrimary = primarySymptoms.filter(s => noSymptoms.includes(s));

      // Calculate score based on matches and conflicts
      // Primary symptoms have higher weight than secondary symptoms
      const primaryScore = matchingPrimary.length / primarySymptoms.length;
      const secondaryScore = matchingSecondary.length / secondarySymptoms.length;

      // Penalize for conflicting primary symptoms
      const conflictPenalty = conflictingPrimary.length * 0.2;

      // Weighted score calculation
      let finalScore = (primaryScore * 0.7 + secondaryScore * 0.3) * weight;
      finalScore = Math.max(0, finalScore - conflictPenalty); // Apply penalty but don't go below 0

      // Only consider diseases with some evidence
      if (matchingPrimary.length > 0 || matchingSecondary.length > 0) {
        diagnoses.push({
          disease,
          probability: finalScore,
          matchingSymptoms: [...matchingPrimary, ...matchingSecondary]
        });
      }
    });

    // Sort diagnoses by probability
    const sortedDiagnoses = diagnoses.sort((a, b) => b.probability - a.probability);

    // If we have valid diagnoses, return them
    if (sortedDiagnoses.length > 0) {
      // Normalize probabilities to be between 0 and 1
      const maxProb = Math.max(...sortedDiagnoses.map(d => d.probability));
      const normalizedDiagnoses = sortedDiagnoses.map(d => ({
        ...d,
        probability: Math.min(0.95, (d.probability / maxProb) * 0.9)
      }));

      setDiagnosis(normalizedDiagnoses);
    } else {
      // If no matches found, provide more specific feedback based on symptoms
      let fallbackDiagnoses = [];

      if (yesSymptoms.length === 0) {
        fallbackDiagnoses.push({ disease: "Healthy", probability: 0.9 });
      } else if (yesSymptoms.some(s => s.includes("pain") || s.includes("ache"))) {
        fallbackDiagnoses.push({ disease: "Pain Disorder", probability: 0.4 });
      } else if (yesSymptoms.some(s => s.includes("cough") || s.includes("throat") || s.includes("congestion"))) {
        fallbackDiagnoses.push({ disease: "Upper Respiratory Condition", probability: 0.45 });
      } else if (yesSymptoms.some(s => s.includes("stomach") || s.includes("nausea") || s.includes("vomit"))) {
        fallbackDiagnoses.push({ disease: "Digestive Disorder", probability: 0.42 });
      } else {
        fallbackDiagnoses.push({ disease: "Unspecified Condition", probability: 0.3 });
      }

      // Add note about insufficient information
      fallbackDiagnoses[0].insufficientData = true;

      setDiagnosis(fallbackDiagnoses);
    }

    setShowingDiagnosis(true);
  };

  // Process the user's answer
  const processAnswer = (hasSymptom) => {
    if (!currentQuestion || !metadata) return;

    const symptomIdx = metadata.symptomNames.indexOf(currentQuestion);
    if (symptomIdx === -1) {
      console.error(`Symptom '${currentQuestion}' not found in the list.`);
      return;
    }

    // Update symptoms array
    const updatedSymptoms = [...currentSymptoms];
    updatedSymptoms[symptomIdx] = hasSymptom ? 1 : 0;
    setCurrentSymptoms(updatedSymptoms);

    // Update tracking lists
    if (hasSymptom) {
      setYesSymptoms([...yesSymptoms, currentQuestion]);
    } else {
      setNoSymptoms([...noSymptoms, currentQuestion]);
    }

    // Update asked symptoms set
    const updatedAsked = new Set(askedSymptoms);
    updatedAsked.add(currentQuestion);
    setAskedSymptoms(updatedAsked);

    // Increment question counter
    const newCount = questionCount + 1;
    setQuestionCount(newCount);

    // Ask next question
    askNextQuestion(symptomPools, updatedAsked, newCount);
  };

  // Reset the game
  const resetGame = () => {
    if (!metadata) return;

    setAskedSymptoms(new Set());
    setCurrentSymptoms(new Array(metadata.symptomNames.length).fill(0));
    setYesSymptoms([]);
    setNoSymptoms([]);
    setQuestionCount(0);
    setCurrentQuestion(null);
    setDiagnosis([]);
    setGameOver(false);
    setShowingDiagnosis(false);

    // Ask the first question
    if (symptomPools) {
      askNextQuestion(symptomPools, new Set(), 0);
    }
  };

  // Finish game early and show diagnosis
  const finishGame = () => {
    setGameOver(true);
    getDiagnosisWithoutInference();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Loading Medinator...</h1>
          <div className="animate-pulse bg-blue-200 h-2 w-full rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Model</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">MEDINATOR</h1>

        {isModelLoaded ? (
          <>
            {!gameOver && !showingDiagnosis && currentQuestion && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Question {questionCount + 1}</h2>
                <p className="text-lg mb-6">Does the patient have: <span className="font-bold">{currentQuestion}</span>?</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => processAnswer(true)}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => processAnswer(false)}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    No
                  </button>
                </div>

                {/* Show Finish button after MIN_QUESTIONS */}
                {questionCount >= MIN_QUESTIONS && (
                  <div className="text-center mt-6">
                    <button
                      onClick={finishGame}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Finish and Get Diagnosis
                    </button>
                  </div>
                )}
              </div>
            )}

            {showingDiagnosis && (
  <div className="mb-8 border-t pt-6">
    <h2 className="text-xl font-semibold mb-4 text-center">
      {gameOver ? "Final Diagnosis" : "Current Possibilities"}
    </h2>

    {diagnosis.length > 0 ? (
      <div>
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Most likely diagnosis:</h3>
          <p className="text-xl font-bold text-blue-600">
            {diagnosis[0].disease}
          </p>
          <p className="text-gray-700">
            Confidence: {(diagnosis[0].probability * 100).toFixed(1)}%
          </p>

          {diagnosis[0].insufficientData && (
            <p className="text-amber-600 mt-2 text-sm">
              Note: More information needed for a more accurate diagnosis.
            </p>
          )}

          {diagnosis[0].matchingSymptoms && (
            <div className="mt-2 text-sm">
              <p className="font-medium">Matching symptoms:</p>
              <p>{diagnosis[0].matchingSymptoms.join(", ")}</p>
            </div>
          )}
        </div>

        {diagnosis.length > 1 && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Other possibilities:</h3>
            <ul className="list-disc pl-5">
              {diagnosis.slice(1, 4).map((result, idx) => (
                <li key={idx} className="mb-2">
                  <div className="font-medium">{result.disease}: {(result.probability * 100).toFixed(1)}%</div>
                  {result.matchingSymptoms && (
                    <div className="text-sm text-gray-600">
                      Matching: {result.matchingSymptoms.join(", ")}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    ) : (
      <p className="text-center text-gray-700">
        Not enough information to make a diagnosis.
      </p>
    )}

    <div className="mt-4 border-t pt-4">
      <h3 className="font-medium mb-2">Symptom Summary:</h3>
      <div className="mb-2">
        <p className="font-medium text-green-600">Confirmed symptoms:</p>
        {yesSymptoms.length > 0 ? (
          <p>{yesSymptoms.join(", ")}</p>
        ) : (
          <p className="text-gray-500 italic">None confirmed</p>
        )}
      </div>
      <div>
        <p className="font-medium text-red-600">Denied symptoms:</p>
        {noSymptoms.length > 0 ? (
          <p>{noSymptoms.join(", ")}</p>
        ) : (
          <p className="text-gray-500 italic">None denied</p>
        )}
      </div>
    </div>

    <div className="flex justify-center mt-6">
      {!gameOver && (
        <button
          onClick={() => setShowingDiagnosis(false)}
          className="px-4 py-2 bg-blue-500 text-white rounded mr-3 hover:bg-blue-600"
        >
          Continue Questions
        </button>
      )}
      <button
        onClick={resetGame}
        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        Start Over
      </button>
    </div>
  </div>
)}

            <div className="text-center text-sm text-gray-500 mt-8">
              <p>Questions asked: {questionCount} | Symptoms confirmed: {yesSymptoms.length}</p>
              <p className="mt-4">
                Disclaimer: This is a simulation and not a substitute for professional medical advice.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center">
            <p>Failed to load Medinator model. Please try again.</p>
          </div>
        )}
      </div>
    </div>
  );
}
