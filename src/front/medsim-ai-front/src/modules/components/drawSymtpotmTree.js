import { useState, useEffect } from 'react';
import { ChevronRight, RefreshCw, AlertCircle, CheckCircle, HelpCircle, X, ArrowRight, ThumbsUp, ThumbsDown, FileText } from 'lucide-react';

// Mock data in case we need to use it before fetch completes
const mockData = {
  diseases: ["Loading..."],
  symptoms: ["Loading..."],
  disease_symptom_profiles: {}
};

export default function DiagnosticApp() {
  // Application state
  const [diagnosticData, setDiagnosticData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPhase, setCurrentPhase] = useState('welcome'); // welcome, initial, followup, results
  const [currentSymptomIndex, setCurrentSymptomIndex] = useState(0);
  const [reportedSymptoms, setReportedSymptoms] = useState(new Set());
  const [deniedSymptoms, setDeniedSymptoms] = useState(new Set());
  const [uncertainSymptoms, setUncertainSymptoms] = useState(new Set());
  const [initialSymptoms, setInitialSymptoms] = useState([]);
  const [followUpSymptoms, setFollowUpSymptoms] = useState([]);
  const [topCandidates, setTopCandidates] = useState([]);
  const [diagnosticResults, setDiagnosticResults] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Load diagnostic data
  useEffect(() => {
    async function fetchData() {
      try {
        // In a real application, this would fetch from your server
        // For demo purposes, we'll use a direct import or mock data URL
        const response = await fetch("model/disease_diagnostic_web_data.json");
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        const data = await response.json();
        setDiagnosticData(data);

        // Calculate starting symptoms
        const startingSymptoms = getStartingSymptoms(data);
        setInitialSymptoms(startingSymptoms);

        setLoading(false);
      } catch (err) {
        console.error("Error loading diagnostic data:", err);
        setError(`Failed to load diagnostic data: ${err.message}`);
        // For demo, we'll use mock data if fetch fails
        setDiagnosticData(mockData);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Helper functions
  const getStartingSymptoms = (data) => {
    // Get symptoms that appear in the most diseases (most informative)
    const diseaseCount = {};

    data.symptoms.forEach(symptom => {
      diseaseCount[symptom] = 0;
    });

    Object.entries(data.disease_symptom_profiles).forEach(([disease, profile]) => {
      profile.common_symptoms.forEach(symptom => {
        diseaseCount[symptom] = (diseaseCount[symptom] || 0) + 1;
      });
    });

    // Sort symptoms by appearance count and return top ones that appear in multiple diseases
    return Object.entries(diseaseCount)
      .sort((a, b) => b[1] - a[1])
      .filter(([_, count]) => count > 1)
      .slice(0, 5)
      .map(([symptom]) => symptom);
  };

  const processResponse = (symptom, response) => {
    if (response === "yes") {
      setReportedSymptoms(prev => new Set([...prev, symptom]));
    } else if (response === "no") {
      setDeniedSymptoms(prev => new Set([...prev, symptom]));
    } else { // unsure
      setUncertainSymptoms(prev => new Set([...prev, symptom]));
    }

    // Move to next symptom
    if (currentPhase === 'initial' && currentSymptomIndex < initialSymptoms.length - 1) {
      setCurrentSymptomIndex(currentSymptomIndex + 1);
    } else if (currentPhase === 'initial' && currentSymptomIndex >= initialSymptoms.length - 1) {
      // Initial phase complete - calculate results and move to follow-up
      const scores = calculateDiseaseScores();
      const candidates = scores.slice(0, 3).map(([disease]) => disease);
      setTopCandidates(candidates);

      // Generate follow-up questions
      const followUp = generateFollowUpQuestions(candidates);
      setFollowUpSymptoms(followUp);

      // Move to follow-up phase
      setCurrentPhase('followup');
      setCurrentSymptomIndex(0);
    } else if (currentPhase === 'followup' && currentSymptomIndex < followUpSymptoms.length - 1) {
      setCurrentSymptomIndex(currentSymptomIndex + 1);
    } else if (currentPhase === 'followup' && currentSymptomIndex >= followUpSymptoms.length - 1) {
      // All questions complete - show final results
      const results = analyzeResults();
      setDiagnosticResults(results);
      setCurrentPhase('results');
    }
  };

  const calculateDiseaseScores = () => {
    if (!diagnosticData) return [];

    const diseaseScores = {};

    Object.entries(diagnosticData.disease_symptom_profiles).forEach(([disease, profile]) => {
      let score = 0;
      let symptomCount = 0;

      // Calculate score based on reported symptoms
      [...reportedSymptoms].forEach(symptom => {
        if (profile.symptom_prevalence && profile.symptom_prevalence[symptom]) {
          const prevalence = profile.symptom_prevalence[symptom];
          score += prevalence;
          symptomCount++;
        }
      });

      // Penalize for denied key symptoms
      [...deniedSymptoms].forEach(symptom => {
        if (profile.common_symptoms && profile.common_symptoms.includes(symptom)) {
          const prevalence = profile.symptom_prevalence?.[symptom] || 0;
          if (prevalence > 0.5) {
            score -= prevalence * 0.5;
          }
        }
      });

      // Normalize score
      if (symptomCount > 0) {
        const coverage = profile.common_symptoms ?
          symptomCount / profile.common_symptoms.length : 0;
        const finalScore = score * (0.5 + 0.5 * coverage);
        diseaseScores[disease] = finalScore;
      } else {
        diseaseScores[disease] = 0;
      }
    });

    // Sort and return as array of [disease, score] pairs
    return Object.entries(diseaseScores)
      .sort((a, b) => b[1] - a[1]);
  };

  const generateFollowUpQuestions = (topDiseases) => {
    if (!diagnosticData) return [];

    const potentialQuestions = new Set();
    const askedSymptoms = new Set([
      ...reportedSymptoms,
      ...deniedSymptoms,
      ...uncertainSymptoms
    ]);

    topDiseases.forEach(disease => {
      const profile = diagnosticData.disease_symptom_profiles[disease];

      if (profile && profile.common_symptoms) {
        profile.common_symptoms.forEach(symptom => {
          if (!askedSymptoms.has(symptom)) {
            potentialQuestions.add(symptom);
          }
        });
      }
    });

    // Score questions by diagnostic value
    const questionScores = {};
    potentialQuestions.forEach(symptom => {
      let score = 0;

      topDiseases.forEach(disease => {
        const profile = diagnosticData.disease_symptom_profiles[disease];
        if (profile &&
            profile.common_symptoms &&
            profile.common_symptoms.includes(symptom) &&
            profile.symptom_prevalence) {
          score += profile.symptom_prevalence[symptom] || 0;
        }
      });

      questionScores[symptom] = score;
    });

    // Sort and return symptoms with highest diagnostic value
    const sortedQuestions = Object.entries(questionScores)
      .sort((a, b) => b[1] - a[1])
      .map(([symptom]) => symptom);

    // Limit to max 7 follow-up questions to prevent fatigue
    return sortedQuestions.slice(0, 7);
  };

  const analyzeResults = () => {
    const diseaseScores = calculateDiseaseScores();
    const topDiseases = diseaseScores.slice(0, 3);

    // Handle empty results
    if (topDiseases.length === 0) {
      return {
        primary_diagnosis: "Unknown",
        score: 0,
        confidence_level: "low",
        reported_symptoms: [...reportedSymptoms],
        differential_diagnoses: [],
        recommendation: "Not enough information to make a diagnosis. Please consult a healthcare professional."
      };
    }

    const [primaryDisease, primaryScore] = topDiseases[0];

    // Calculate confidence level
    let confidenceLevel = "low";
    if (topDiseases.length > 1) {
      const scoreRatio = topDiseases[1][1] > 0 ?
        primaryScore / topDiseases[1][1] : 2.0;

      if (scoreRatio > 1.5) {
        confidenceLevel = primaryScore > 2.0 ? "high" : "medium";
      } else {
        confidenceLevel = primaryScore > 1.5 ? "medium" : "low";
      }
    } else {
      confidenceLevel = primaryScore > 1.0 ? "medium" : "low";
    }

    // Check symptom coverage for primary disease
    const profile = diagnosticData.disease_symptom_profiles[primaryDisease];
    if (profile && profile.common_symptoms) {
      const keySymptoms = new Set(profile.common_symptoms.slice(0, 5));
      const reportedKeySymptoms = [...reportedSymptoms].filter(s => keySymptoms.has(s));

      if (reportedKeySymptoms.length >= 3 && primaryScore > 2.0) {
        confidenceLevel = "high";
      } else if (reportedKeySymptoms.length <= 1 && confidenceLevel === "high") {
        confidenceLevel = "medium";
      }
    }

    // Prepare differential diagnoses
    const differentials = topDiseases.slice(1).map(([disease, score]) => {
      const ratio = primaryScore > 0 ? score / primaryScore : 0;
      const considerationLevel = ratio > 0.8 ? "strong" :
                              ratio > 0.5 ? "moderate" : "mild";

      // Find unique symptoms for this differential
      const profile = diagnosticData.disease_symptom_profiles[disease];
      const uniqueSymptoms = profile && profile.common_symptoms ?
        profile.common_symptoms
          .slice(0, 5)
          .filter(s => !reportedSymptoms.has(s) && !deniedSymptoms.has(s))
          .slice(0, 3) : [];

      return {
        disease,
        score,
        consideration_level: considerationLevel,
        distinguishing_symptoms: uniqueSymptoms
      };
    });

    // Prepare recommendation
    let recommendation = "";
    if (confidenceLevel === "high") {
      recommendation = "This diagnosis matches your symptoms strongly. However, please consult a healthcare professional for confirmation.";
    } else if (confidenceLevel === "medium") {
      recommendation = "Your symptoms suggest this condition, but other conditions should be considered. Please consult a healthcare professional.";
    } else {
      recommendation = "Your symptoms don't strongly match any single condition. Medical consultation is strongly recommended.";
    }

    return {
      primary_diagnosis: primaryDisease,
      score: primaryScore,
      confidence_level: confidenceLevel,
      reported_symptoms: [...reportedSymptoms],
      differential_diagnoses: differentials,
      recommendation
    };
  };

  const restartDiagnostic = () => {
    setCurrentPhase('welcome');
    setCurrentSymptomIndex(0);
    setReportedSymptoms(new Set());
    setDeniedSymptoms(new Set());
    setUncertainSymptoms(new Set());
    setTopCandidates([]);
    setDiagnosticResults(null);
    setShowFeedback(false);
  };

  // Current symptom being asked
  const currentSymptom = currentPhase === 'initial'
    ? initialSymptoms[currentSymptomIndex]
    : currentPhase === 'followup'
      ? followUpSymptoms[currentSymptomIndex]
      : null;

  // UI Components
  const LoadingScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-4" />
      <h2 className="text-xl font-bold mb-2">Loading Diagnostic System</h2>
      <p className="text-gray-600">Please wait while we prepare the symptom checker...</p>
    </div>
  );

  const ErrorScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-red-50">
      <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
      <h2 className="text-xl font-bold mb-2">Error Loading Data</h2>
      <p className="text-gray-700 mb-4">{error}</p>
      <button
        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow"
        onClick={() => window.location.reload()}
      >
        Retry
      </button>
    </div>
  );

  const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center p-6 max-w-lg mx-auto text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
        <FileText className="w-8 h-8 text-blue-500" />
      </div>

      <h1 className="text-2xl font-bold mb-4">Healthcare Symptom Checker</h1>
      <p className="text-gray-600 mb-6">
        Answer a series of questions about your symptoms to get a preliminary assessment.
        This tool is for informational purposes only and does not replace medical advice.
      </p>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-left w-full">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              This is not a medical diagnosis. Always consult with a qualified healthcare provider.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() => setCurrentPhase('initial')}
        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow flex items-center justify-center w-full sm:w-auto"
      >
        Begin Assessment <ChevronRight className="ml-2 w-4 h-4" />
      </button>
    </div>
  );

  const QuestionScreen = () => {
    const progress = currentPhase === 'initial'
      ? (currentSymptomIndex + 1) / initialSymptoms.length
      : (currentSymptomIndex + 1) / followUpSymptoms.length;

    const phaseTitle = currentPhase === 'initial'
      ? 'Initial Assessment'
      : 'Follow-up Questions';

    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2">{phaseTitle}</h2>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-500 h-2.5 rounded-full"
              style={{ width: `${progress * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Question {currentSymptomIndex + 1} of {
              currentPhase === 'initial' ? initialSymptoms.length : followUpSymptoms.length
            }
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-medium mb-6">
            Do you have <span className="text-blue-600 font-semibold">{currentSymptom}</span>?
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => processResponse(currentSymptom, "yes")}
              className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
            >
              <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
              <span className="font-medium">Yes</span>
            </button>

            <button
              onClick={() => processResponse(currentSymptom, "no")}
              className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
            >
              <X className="w-8 h-8 text-red-500 mb-2" />
              <span className="font-medium">No</span>
            </button>

            <button
              onClick={() => processResponse(currentSymptom, "unsure")}
              className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-yellow-50 hover:border-yellow-300 transition-colors"
            >
              <HelpCircle className="w-8 h-8 text-yellow-500 mb-2" />
              <span className="font-medium">Unsure</span>
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          {currentPhase === 'initial'
            ? 'These questions help us narrow down potential conditions.'
            : 'These follow-up questions help refine our assessment.'}
        </p>
      </div>
    );
  };

  const ResultsScreen = () => {
    if (!diagnosticResults) return null;

    const getConfidenceColor = (level) => {
      switch (level) {
        case 'high': return 'text-green-600';
        case 'medium': return 'text-yellow-600';
        case 'low': return 'text-red-600';
        default: return 'text-gray-600';
      }
    };

    const getConsiderationColor = (level) => {
      switch (level) {
        case 'strong': return 'text-yellow-600';
        case 'moderate': return 'text-blue-600';
        case 'mild': return 'text-gray-600';
        default: return 'text-gray-600';
      }
    };

    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Assessment Results</h2>
          <p className="text-gray-600">Based on the symptoms you reported</p>
        </div>

        {/* Primary Diagnosis */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">
            Primary Assessment
          </h3>

          <div className="flex items-center mb-4">
            <div className="text-xl font-bold">{diagnosticResults.primary_diagnosis}</div>
            <div className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${
              getConfidenceColor(diagnosticResults.confidence_level) === 'text-green-600' ? 'bg-green-100' :
              getConfidenceColor(diagnosticResults.confidence_level) === 'text-yellow-600' ? 'bg-yellow-100' :
              'bg-red-100'
            }`}>
              <span className={getConfidenceColor(diagnosticResults.confidence_level)}>
                {diagnosticResults.confidence_level.toUpperCase()} CONFIDENCE
              </span>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Matched Symptoms:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {diagnosticResults.reported_symptoms.slice(0, 6).map((symptom, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span>{symptom}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <p className="text-blue-800">{diagnosticResults.recommendation}</p>
          </div>
        </div>

        {/* Differential Diagnoses */}
        {diagnosticResults.differential_diagnoses.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              Alternative Possibilities to Consider
            </h3>

            <div className="space-y-4">
              {diagnosticResults.differential_diagnoses.map((diff, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center mb-2">
                    <h4 className="font-medium">{diff.disease}</h4>
                    <span className={`ml-2 text-sm ${getConsiderationColor(diff.consideration_level)}`}>
                      ({diff.consideration_level} consideration)
                    </span>
                  </div>

                  {diff.distinguishing_symptoms.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Additional symptoms to ask about:</p>
                      <ul className="pl-5 list-disc text-sm text-gray-700">
                        {diff.distinguishing_symptoms.map((symptom, i) => (
                          <li key={i}>{symptom}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800 font-medium mb-1">IMPORTANT DISCLAIMER</p>
          <p className="text-sm text-red-700">
            This assessment is for informational purposes only and does not constitute medical advice,
            diagnosis, or treatment. Always seek the advice of your physician or other qualified health
            provider with any questions regarding a medical condition.
          </p>
        </div>

        {/* Actions */}
        {!showFeedback ? (
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <button
              onClick={() => setShowFeedback(true)}
              className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg"
            >
              Was this helpful?
            </button>

            <button
              onClick={restartDiagnostic}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Start New Assessment
            </button>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="mb-3 text-gray-700">Was this assessment helpful?</p>
            <div className="flex gap-4">
              <button
                className="flex items-center px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg"
                onClick={() => {
                  alert("Thank you for your feedback! We're glad this was helpful.");
                  setShowFeedback(false);
                }}
              >
                <ThumbsUp className="w-4 h-4 mr-2" /> Yes, it was helpful
              </button>

              <button
                className="flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg"
                onClick={() => {
                  alert("Thank you for your feedback. We'll work to improve our system.");
                  setShowFeedback(false);
                }}
              >
                <ThumbsDown className="w-4 h-4 mr-2" /> No, not helpful
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Main render
  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 flex justify-between items-center">
          <h1 className="text-lg font-bold text-blue-600">Healthcare Symptom Checker</h1>
          {currentPhase !== 'welcome' && (
            <button
              onClick={restartDiagnostic}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Restart
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {currentPhase === 'welcome' && <WelcomeScreen />}
        {(currentPhase === 'initial' || currentPhase === 'followup') && <QuestionScreen />}
        {currentPhase === 'results' && <ResultsScreen />}
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-sm text-gray-500">
          <p>© 2025 Healthcare Symptom Checker - For educational purposes only</p>
        </div>
      </footer>
    </div>
  );
}
