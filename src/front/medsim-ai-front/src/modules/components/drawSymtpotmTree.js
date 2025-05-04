import { useState, useEffect } from 'react';
import { ChevronRight, RefreshCw, AlertCircle, CheckCircle, HelpCircle, X, ArrowRight, ThumbsUp, ThumbsDown, FileText, Activity } from 'lucide-react'; // Added Activity icon

// Mock data (remains the same)
const mockData = {
    diseases: ["Loading..."],
    symptoms: ["Loading..."],
    disease_symptom_profiles: {}
};

export default function DiagnosticApp() {
    // --- State Variables (No changes here) ---
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

    // --- useEffect for Data Fetching (No changes here) ---
    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch("model/disease_diagnostic_web_data.json");
                if (!response.ok) {
                    throw new Error(`Failed to fetch: ${response.status}`);
                }
                const data = await response.json();
                setDiagnosticData(data);
                const startingSymptoms = getStartingSymptoms(data);
                setInitialSymptoms(startingSymptoms);
                setLoading(false);
            } catch (err) {
                console.error("Error loading diagnostic data:", err);
                setError(`Failed to load diagnostic data: ${err.message}`);
                setDiagnosticData(mockData); // Use mock on error
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // --- Helper Functions (No changes in logic) ---
    const getStartingSymptoms = (data) => {
        if (!data || !data.symptoms || !data.disease_symptom_profiles) return [];
        const diseaseCount = {};
        data.symptoms.forEach(symptom => { diseaseCount[symptom] = 0; });
        Object.values(data.disease_symptom_profiles).forEach(profile => {
            profile.common_symptoms?.forEach(symptom => {
                if (diseaseCount.hasOwnProperty(symptom)) {
                    diseaseCount[symptom]++;
                }
            });
        });
        return Object.entries(diseaseCount)
            .sort((a, b) => b[1] - a[1])
            .filter(([_, count]) => count > 1) // Keep symptoms appearing in > 1 disease
            .slice(0, 5) // Limit to top 5 initial
            .map(([symptom]) => symptom);
    };

    const processResponse = (symptom, response) => {
        if (response === "yes") {
            setReportedSymptoms(prev => new Set([...prev, symptom]));
            // Clear from other sets if previously marked differently
            setDeniedSymptoms(prev => new Set([...prev].filter(s => s !== symptom)));
            setUncertainSymptoms(prev => new Set([...prev].filter(s => s !== symptom)));
        } else if (response === "no") {
            setDeniedSymptoms(prev => new Set([...prev, symptom]));
            setReportedSymptoms(prev => new Set([...prev].filter(s => s !== symptom)));
            setUncertainSymptoms(prev => new Set([...prev].filter(s => s !== symptom)));
        } else { // unsure
            setUncertainSymptoms(prev => new Set([...prev, symptom]));
            setReportedSymptoms(prev => new Set([...prev].filter(s => s !== symptom)));
            setDeniedSymptoms(prev => new Set([...prev].filter(s => s !== symptom)));
        }

        // Phase Transition Logic (unchanged)
        if (currentPhase === 'initial') {
            if (currentSymptomIndex < initialSymptoms.length - 1) {
                setCurrentSymptomIndex(currentSymptomIndex + 1);
            } else {
                const scores = calculateDiseaseScores();
                const candidates = scores.slice(0, 3).map(([disease]) => disease);
                setTopCandidates(candidates);
                const followUp = generateFollowUpQuestions(candidates);
                setFollowUpSymptoms(followUp);
                setCurrentPhase('followup');
                setCurrentSymptomIndex(0);
            }
        } else if (currentPhase === 'followup') {
            if (currentSymptomIndex < followUpSymptoms.length - 1) {
                setCurrentSymptomIndex(currentSymptomIndex + 1);
            } else {
                const results = analyzeResults();
                setDiagnosticResults(results);
                setCurrentPhase('results');
            }
        }
    };

    const calculateDiseaseScores = () => {
        if (!diagnosticData) return [];
        const diseaseScores = {};
        Object.entries(diagnosticData.disease_symptom_profiles).forEach(([disease, profile]) => {
            let score = 0;
            let symptomCount = 0;
            [...reportedSymptoms].forEach(symptom => {
                if (profile.symptom_prevalence?.[symptom]) {
                    score += profile.symptom_prevalence[symptom];
                    symptomCount++;
                }
            });
            [...deniedSymptoms].forEach(symptom => {
                if (profile.common_symptoms?.includes(symptom)) {
                    const prevalence = profile.symptom_prevalence?.[symptom] || 0;
                    if (prevalence > 0.5) { // Penalize more for denying common symptoms
                        score -= prevalence * 0.75; // Increased penalty slightly
                    } else {
                        score -= prevalence * 0.25; // Smaller penalty for less common
                    }
                }
            });

            // Adjust score based on symptom coverage of the disease profile
            const totalProfileSymptoms = profile.common_symptoms?.length || 1;
            const coverage = symptomCount / totalProfileSymptoms;
            // More sophisticated score adjustment - boost for good coverage, penalize for very low
            let coverageFactor = 1.0;
            if (coverage > 0.5) coverageFactor = 1.0 + (coverage - 0.5); // Boost for >50% coverage
            else if (coverage < 0.2 && totalProfileSymptoms > 3) coverageFactor = 0.75; // Penalize if <20% coverage for diseases with several symptoms

            // Normalize slightly to prevent runaway scores, ensure non-negative
            const finalScore = Math.max(0, score * coverageFactor);
            diseaseScores[disease] = finalScore;
        });

        return Object.entries(diseaseScores).sort((a, b) => b[1] - a[1]);
    };

    const generateFollowUpQuestions = (topDiseases) => {
        if (!diagnosticData) return [];
        const potentialQuestions = new Set();
        const askedSymptoms = new Set([...initialSymptoms, ...reportedSymptoms, ...deniedSymptoms, ...uncertainSymptoms]); // Include initial to avoid asking again

        topDiseases.forEach(disease => {
            const profile = diagnosticData.disease_symptom_profiles[disease];
            profile?.common_symptoms?.forEach(symptom => {
                if (!askedSymptoms.has(symptom)) {
                    potentialQuestions.add(symptom);
                }
            });
            // Also consider less common symptoms if top candidates are very close
            profile?.other_symptoms?.forEach(symptom => {
                 if (!askedSymptoms.has(symptom)) {
                     potentialQuestions.add(symptom);
                 }
            });
        });

        // Score questions by potential to differentiate between top candidates
        const questionScores = {};
        potentialQuestions.forEach(symptom => {
            let scores = topDiseases.map(disease => {
                const profile = diagnosticData.disease_symptom_profiles[disease];
                return profile?.symptom_prevalence?.[symptom] || 0;
            });
            // Score based on variance in prevalence among top candidates (higher variance = more differentiating)
            const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
            const variance = scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length;
            // Add a factor for general prevalence across candidates
            const totalPrevalence = scores.reduce((a, b) => a + b, 0);
            questionScores[symptom] = variance * 5 + totalPrevalence; // Weight variance higher
        });

        const sortedQuestions = Object.entries(questionScores)
            .sort((a, b) => b[1] - a[1])
            .map(([symptom]) => symptom);

        return sortedQuestions.slice(0, 7); // Keep max 7 follow-up
    };

    const analyzeResults = () => {
        const diseaseScores = calculateDiseaseScores();
        const topDiseases = diseaseScores.slice(0, 3);

        if (topDiseases.length === 0 || topDiseases[0][1] <= 0.1) { // Stricter threshold for unknown
            return {
                primary_diagnosis: "Undetermined",
                score: 0,
                confidence_level: "very low",
                reported_symptoms: [...reportedSymptoms],
                denied_symptoms: [...deniedSymptoms], // Include denied for context
                differential_diagnoses: [],
                recommendation: "Your reported symptoms do not strongly match the conditions in our database. Please consult a healthcare professional for a proper evaluation."
            };
        }

        const [primaryDisease, primaryScore] = topDiseases[0];
        let confidenceLevel;
        const scoreThresholds = { high: 2.5, medium: 1.0, low: 0.2 }; // Adjusted thresholds

        if (primaryScore >= scoreThresholds.high) {
            confidenceLevel = 'high';
        } else if (primaryScore >= scoreThresholds.medium) {
            confidenceLevel = 'medium';
        } else if (primaryScore >= scoreThresholds.low) {
            confidenceLevel = 'low';
        } else {
            confidenceLevel = 'very low'; // Added very low
        }

        // Adjust confidence based on score gap to next candidate
        if (topDiseases.length > 1) {
            const scoreRatio = topDiseases[1][1] > 0 ? primaryScore / topDiseases[1][1] : 10; // Handle zero score
            if (scoreRatio < 1.2 && confidenceLevel === 'high') confidenceLevel = 'medium';
            if (scoreRatio < 1.5 && confidenceLevel === 'medium') confidenceLevel = 'low';
            if (scoreRatio < 1.8 && confidenceLevel === 'low') confidenceLevel = 'very low';
            if (scoreRatio > 3.0 && confidenceLevel === 'low') confidenceLevel = 'medium'; // Promote if gap is huge
        }

        // Check symptom coverage for primary diagnosis
        const profile = diagnosticData.disease_symptom_profiles[primaryDisease];
        if (profile?.common_symptoms) {
            const commonSymptoms = new Set(profile.common_symptoms);
            const reportedCommonCount = [...reportedSymptoms].filter(s => commonSymptoms.has(s)).length;
            const deniedCommonCount = [...deniedSymptoms].filter(s => commonSymptoms.has(s)).length;

            // Further adjust confidence based on specific symptom matches/mismatches
            if (reportedCommonCount === 0 && commonSymptoms.size > 0 && confidenceLevel !== 'very low') {
                confidenceLevel = 'low'; // Downgrade if no common symptoms match
            }
            if (deniedCommonCount >= 2 && confidenceLevel === 'high') {
                confidenceLevel = 'medium'; // Downgrade if multiple key symptoms denied
            }
            if (reportedCommonCount >= 3 && confidenceLevel === 'low') {
                confidenceLevel = 'medium'; // Upgrade if strong symptom match despite low score
            }
        }


        const differentials = topDiseases.slice(1).map(([disease, score]) => {
            const ratio = primaryScore > 0 ? score / primaryScore : 0;
            const considerationLevel = ratio > 0.7 ? "strong" : ratio > 0.4 ? "moderate" : "mild"; // Adjusted thresholds

            const diffProfile = diagnosticData.disease_symptom_profiles[disease];
            const primaryProfile = diagnosticData.disease_symptom_profiles[primaryDisease];

            // Find symptoms more indicative of the differential diagnosis
            const distinguishingSymptoms = diffProfile?.common_symptoms
                ?.filter(s => {
                    const diffPrevalence = diffProfile.symptom_prevalence?.[s] || 0;
                    const primaryPrevalence = primaryProfile?.symptom_prevalence?.[s] || 0;
                    // Symptom is much more common in differential OR common in diff but not primary
                    return diffPrevalence > 0.3 && (diffPrevalence > primaryPrevalence * 1.5 || primaryPrevalence < 0.2) && !reportedSymptoms.has(s) && !deniedSymptoms.has(s);
                })
                .slice(0, 3) || [];

            return {
                disease,
                score,
                consideration_level: considerationLevel,
                distinguishing_symptoms: distinguishingSymptoms
            };
        }).filter(d => d.score > 0.1); // Only show differentials with some score

        let recommendation;
        switch (confidenceLevel) {
            case 'high': recommendation = `The analysis strongly suggests ${primaryDisease} based on your symptoms. Please consult a healthcare professional for confirmation and advice.`; break;
            case 'medium': recommendation = `Your symptoms show a moderate match for ${primaryDisease}. Other conditions are possible, so consultation with a healthcare professional is recommended for accurate diagnosis.`; break;
            case 'low': recommendation = `There's a slight indication towards ${primaryDisease}, but the match is weak. A medical consultation is important to explore this and other possibilities.`; break;
            default: recommendation = `The assessment is inconclusive. It's essential to consult a healthcare professional for a proper evaluation.`;
        }


        return {
            primary_diagnosis: primaryDisease,
            score: primaryScore,
            confidence_level: confidenceLevel,
            reported_symptoms: [...reportedSymptoms],
            denied_symptoms: [...deniedSymptoms], // Pass denied symptoms too
            differential_diagnoses: differentials,
            recommendation
        };
    };

    const restartDiagnostic = () => {
        setLoading(true); // Show loading briefly for visual feedback
        setCurrentPhase('welcome');
        setCurrentSymptomIndex(0);
        setReportedSymptoms(new Set());
        setDeniedSymptoms(new Set());
        setUncertainSymptoms(new Set());
        setTopCandidates([]);
        setDiagnosticResults(null);
        setShowFeedback(false);
        // Re-calculate initial symptoms in case data changes (though unlikely here)
        if (diagnosticData) {
             const startingSymptoms = getStartingSymptoms(diagnosticData);
             setInitialSymptoms(startingSymptoms);
        }
        // Simulate a slight delay if needed, or just rely on re-render
         setTimeout(() => setLoading(false), 150); // Short delay
    };

    // Current symptom being asked (no changes)
    const currentSymptom = currentPhase === 'initial'
        ? initialSymptoms[currentSymptomIndex]
        : currentPhase === 'followup'
            ? followUpSymptoms[currentSymptomIndex]
            : null;

    // --- UI Components (Enhanced Styling) ---

    const LoadingScreen = () => (
        <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
            <RefreshCw className="w-16 h-16 text-blue-500 animate-spin mb-6" />
            <h2 className="text-2xl font-semibold mb-3 text-gray-700">Loading Diagnostic System</h2>
            <p className="text-lg text-gray-500">Preparing the symptom checker for you...</p>
        </div>
    );

    const ErrorScreen = () => (
        <div className="flex flex-col items-center justify-center flex-1 p-6 text-center bg-red-50 rounded-lg shadow-inner">
            <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
            <h2 className="text-2xl font-semibold mb-3 text-red-800">Error Loading Data</h2>
            <p className="text-lg text-red-700 mb-6">{error}</p>
            <button
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-lg font-medium rounded-lg shadow-md transition duration-150 ease-in-out"
                onClick={() => window.location.reload()} // Simple retry for demo
            >
                Retry Loading
            </button>
        </div>
    );

    const WelcomeScreen = () => (
        // Centered content container within the flex main area
        <div className="flex flex-col items-center justify-center text-center max-w-3xl w-full">
             <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center mb-8 shadow-lg">
                 <Activity className="w-12 h-12 text-white" /> {/* Changed icon */}
             </div>

             <h1 className="text-4xl font-bold mb-5 text-gray-800">Medinator Symptom Assessment</h1>
             <p className="text-xl text-gray-600 mb-8 max-w-xl">
                 Answer a few questions about your symptoms to receive a preliminary, informational assessment.
             </p>

             {/* Enhanced Disclaimer Box */}
             <div className="bg-yellow-100 border-l-4 border-yellow-500 p-5 mb-10 text-left w-full rounded-md shadow">
                 <div className="flex">
                     <div className="flex-shrink-0 pt-0.5">
                         <AlertCircle className="h-6 w-6 text-yellow-600" />
                     </div>
                     <div className="ml-4">
                         <h3 className="text-lg font-medium text-yellow-800">Important Note</h3>
                         <p className="text-md text-yellow-700 mt-1">
                             This tool provides information based on common patterns and <strong className="font-semibold">does not substitute for a professional medical diagnosis</strong>. Always consult with a qualified healthcare provider for any health concerns.
                         </p>
                     </div>
                 </div>
             </div>

             <button
                 onClick={() => setCurrentPhase('initial')}
                 className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold rounded-lg shadow-md hover:shadow-lg transition duration-200 ease-in-out flex items-center justify-center group"
             >
                 Begin Assessment <ChevronRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
             </button>
         </div>
    );

    const QuestionScreen = () => {
        const totalQuestions = currentPhase === 'initial' ? initialSymptoms.length : followUpSymptoms.length;
        const progress = totalQuestions > 0 ? (currentSymptomIndex + 1) / totalQuestions : 0;

        const phaseTitle = currentPhase === 'initial'
            ? 'Initial Symptom Check'
            : `Follow-up Questions (${topCandidates.slice(0,2).join(', ')}?)`; // Hint at context

        // Ensure symptom exists before rendering
         if (!currentSymptom) {
             // This might happen briefly during transition or if arrays are empty
             // Optionally handle this state, e.g., show loading or an error
             // For now, just prevent rendering null/undefined
             console.warn("Current symptom is undefined in QuestionScreen");
             return <LoadingScreen />; // Or some placeholder
         }

        return (
            // Larger, centered card for the question
            <div className="bg-white rounded-xl shadow-xl p-8 sm:p-10 max-w-2xl w-full">
                {/* Progress Bar and Title */}
                <div className="mb-10">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-2xl font-semibold text-gray-700">{phaseTitle}</h2>
                         <p className="text-md text-gray-500">
                             Question {currentSymptomIndex + 1} / {totalQuestions}
                         </p>
                    </div>
                     <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                         <div
                             className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                             style={{ width: `${progress * 100}%` }}
                         ></div>
                     </div>
                 </div>

                {/* The Question */}
                 <div className="text-center mb-10">
                     <h3 className="text-2xl md:text-3xl font-medium text-gray-800 leading-relaxed">
                         Are you experiencing <span className="font-bold text-blue-600">{currentSymptom}</span>?
                     </h3>
                 </div>

                {/* Response Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                    {/* Yes Button */}
                    <button
                        onClick={() => processResponse(currentSymptom, "yes")}
                        className="flex flex-col items-center justify-center p-5 md:p-6 border-2 border-transparent rounded-lg bg-green-50 hover:bg-green-100 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-150 ease-in-out group"
                    >
                        <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-green-500 group-hover:text-green-600 mb-3 transition-colors" />
                        <span className="text-lg md:text-xl font-semibold text-green-800">Yes</span>
                    </button>

                    {/* No Button */}
                    <button
                        onClick={() => processResponse(currentSymptom, "no")}
                        className="flex flex-col items-center justify-center p-5 md:p-6 border-2 border-transparent rounded-lg bg-red-50 hover:bg-red-100 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-150 ease-in-out group"
                    >
                        <X className="w-10 h-10 md:w-12 md:h-12 text-red-500 group-hover:text-red-600 mb-3 transition-colors" />
                        <span className="text-lg md:text-xl font-semibold text-red-800">No</span>
                    </button>

                    {/* Unsure Button */}
                    <button
                        onClick={() => processResponse(currentSymptom, "unsure")}
                        className="flex flex-col items-center justify-center p-5 md:p-6 border-2 border-transparent rounded-lg bg-yellow-50 hover:bg-yellow-100 hover:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-150 ease-in-out group"
                    >
                        <HelpCircle className="w-10 h-10 md:w-12 md:h-12 text-yellow-500 group-hover:text-yellow-600 mb-3 transition-colors" />
                        <span className="text-lg md:text-xl font-semibold text-yellow-800">Unsure</span>
                    </button>
                </div>

                 {/* Helper Text */}
                 <p className="text-center text-base text-gray-500 mt-10">
                     {currentPhase === 'initial'
                         ? 'Your answers help narrow down the possibilities.'
                         : 'These questions help refine the assessment based on likely conditions.'}
                 </p>
             </div>
        );
    };

    const ResultsScreen = () => {
        if (!diagnosticResults) return <LoadingScreen />; // Show loading if results not ready

        const getConfidenceClasses = (level) => {
            switch (level) {
                case 'high': return 'bg-green-100 text-green-800 border-green-300';
                case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                case 'low': return 'bg-orange-100 text-orange-800 border-orange-300'; // Using orange for low
                case 'very low': return 'bg-red-100 text-red-800 border-red-300'; // Red for very low
                default: return 'bg-gray-100 text-gray-800 border-gray-300';
            }
        };

        const getConsiderationClasses = (level) => {
            switch (level) {
                case 'strong': return 'text-yellow-700 font-semibold';
                case 'moderate': return 'text-blue-700 font-medium';
                case 'mild': return 'text-gray-600';
                default: return 'text-gray-600';
            }
        };

        const confidenceTextMap = {
            'high': 'High Confidence',
            'medium': 'Medium Confidence',
            'low': 'Low Confidence',
            'very low': 'Very Low Confidence'
        };

        // Combine reported and denied symptoms for display context
         const allAnsweredSymptoms = [
             ...diagnosticResults.reported_symptoms.map(s => ({ symptom: s, status: 'reported' })),
             ...diagnosticResults.denied_symptoms.map(s => ({ symptom: s, status: 'denied' }))
             // Optionally add uncertain symptoms if needed for display
         ];
        // Limit displayed symptoms for brevity if list is long
        const displayedSymptoms = allAnsweredSymptoms.slice(0, 8);


        return (
            // Wider container for results, allowing more space
            <div className="max-w-4xl w-full space-y-8">
                 <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Assessment Results</h2>
                    <p className="text-lg text-gray-600">Based on the symptoms provided.</p>
                 </div>

                {/* --- Primary Assessment Card --- */}
                 <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200">
                     <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-5 pb-5 border-b border-gray-200">
                         <h3 className="text-2xl font-semibold text-gray-800 mb-2 sm:mb-0">
                             Primary Assessment: <span className="text-blue-700">{diagnosticResults.primary_diagnosis}</span>
                         </h3>
                         <div className={`px-4 py-1.5 rounded-full text-sm font-medium border ${getConfidenceClasses(diagnosticResults.confidence_level)}`}>
                             {confidenceTextMap[diagnosticResults.confidence_level] || 'Confidence Undefined'}
                         </div>
                     </div>

                    {/* Symptoms Summary */}
                     <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-700 mb-3">Symptom Summary (Provided):</h4>
                         {displayedSymptoms.length > 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                 {displayedSymptoms.map(({ symptom, status }, index) => (
                                     <div key={index} className="flex items-center text-base">
                                         {status === 'reported' && <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />}
                                         {status === 'denied' && <X className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />}
                                         <span className={status === 'denied' ? 'line-through text-gray-500' : 'text-gray-700'}>
                                             {symptom}
                                         </span>
                                     </div>
                                 ))}
                                 {allAnsweredSymptoms.length > displayedSymptoms.length && (
                                      <div className="text-gray-500 mt-1 text-sm">...and {allAnsweredSymptoms.length - displayedSymptoms.length} more.</div>
                                 )}
                             </div>
                         ) : (
                            <p className="text-gray-500 italic">No specific symptoms were matched or denied.</p>
                         )}
                     </div>


                     {/* Recommendation Box */}
                     <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-md">
                         <p className="text-base text-blue-900">{diagnosticResults.recommendation}</p>
                     </div>
                 </div>

                {/* --- Differential Diagnoses Card --- */}
                 {diagnosticResults.differential_diagnoses.length > 0 && (
                     <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200">
                         <h3 className="text-xl font-semibold text-gray-800 mb-5 pb-4 border-b border-gray-200">
                             Alternative Possibilities to Consider
                         </h3>
                         <div className="space-y-5">
                             {diagnosticResults.differential_diagnoses.map((diff, index) => (
                                 <div key={index} className="pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                                     <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                                         <h4 className="text-lg font-medium text-gray-700">{diff.disease}</h4>
                                         <span className={`text-sm mt-1 sm:mt-0 ${getConsiderationClasses(diff.consideration_level)}`}>
                                             ({diff.consideration_level} consideration)
                                         </span>
                                     </div>

                                     {diff.distinguishing_symptoms.length > 0 && (
                                         <div className="mt-2 pl-2">
                                             <p className="text-sm text-gray-600 mb-1">Symptoms that might point more towards this condition:</p>
                                             <ul className="list-disc list-inside space-y-1">
                                                 {diff.distinguishing_symptoms.map((symptom, i) => (
                                                     <li key={i} className="text-sm text-gray-700">{symptom}</li>
                                                 ))}
                                             </ul>
                                         </div>
                                     )}
                                      {diff.distinguishing_symptoms.length === 0 && (
                                           <p className="text-sm text-gray-500 italic mt-2 pl-2">No specific distinguishing symptoms identified based on common patterns.</p>
                                      )}
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}

                {/* --- Disclaimer Box --- */}
                <div className="bg-red-50 border border-red-300 rounded-lg p-6 shadow-sm">
                    <h4 className="text-lg font-semibold text-red-800 mb-2 flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2"/> IMPORTANT DISCLAIMER
                    </h4>
                    <p className="text-base text-red-700">
                         This assessment is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions regarding a medical condition. Never disregard professional medical advice or delay seeking it because of something you have read here.
                     </p>
                 </div>

                {/* --- Actions & Feedback --- */}
                 <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                     {!showFeedback ? (
                         <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                             <button
                                 onClick={() => setShowFeedback(true)}
                                 className="px-5 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-base transition duration-150 order-2 sm:order-1"
                             >
                                 Provide Feedback
                             </button>
                             <button
                                 onClick={restartDiagnostic}
                                 className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow hover:shadow-md flex items-center justify-center text-lg transition duration-150 order-1 sm:order-2 w-full sm:w-auto"
                             >
                                 <RefreshCw className="w-5 h-5 mr-2" /> Start New Assessment
                             </button>
                         </div>
                     ) : (
                         // Enhanced Feedback Section
                         <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                             <p className="mb-4 text-lg font-medium text-center text-blue-800">Was this assessment helpful?</p>
                             <div className="flex flex-col sm:flex-row justify-center gap-4">
                                 <button
                                     className="flex items-center justify-center px-6 py-3 bg-green-100 hover:bg-green-200 text-green-800 font-medium rounded-lg transition duration-150 w-full sm:w-auto"
                                     onClick={() => {
                                         alert("Thank you for your positive feedback!"); // Keep alerts simple for demo
                                         setShowFeedback(false);
                                     }}
                                 >
                                     <ThumbsUp className="w-5 h-5 mr-2" /> Yes, helpful
                                 </button>
                                 <button
                                     className="flex items-center justify-center px-6 py-3 bg-red-100 hover:bg-red-200 text-red-800 font-medium rounded-lg transition duration-150 w-full sm:w-auto"
                                     onClick={() => {
                                         alert("Thank you for the feedback. We'll strive to improve.");
                                         setShowFeedback(false);
                                     }}
                                 >
                                     <ThumbsDown className="w-5 h-5 mr-2" /> No, not really
                                 </button>
                             </div>
                         </div>
                     )}
                 </div>
             </div>
        );
    };

    // --- Main Render Structure ---
    return (
        // Flex container for full height layout
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50"> {/* Subtle gradient background */}
             {/* Sticky Header */}
             <header className="bg-white shadow-md sticky top-0 z-10 border-b border-gray-200">
                 <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
                     {/* Enhanced Title/Logo */}
                      <div className="flex items-center space-x-2">
                         <Activity className="w-7 h-7 text-blue-600" />
                         <h1 className="text-xl font-bold text-blue-700 tracking-tight">Medinator</h1>
                      </div>
                      {currentPhase !== 'welcome' && !loading && !error && (
                         <button
                             onClick={restartDiagnostic}
                             className="text-sm text-gray-600 hover:text-blue-600 flex items-center transition duration-150"
                             title="Restart Assessment"
                         >
                             <RefreshCw className="w-4 h-4 mr-1.5" /> Restart
                         </button>
                     )}
                 </div>
             </header>

             {/* Main Content Area - Takes remaining space and centers content */}
             <main className="flex-1 flex items-center justify-center w-full py-8 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-y-auto"> {/* Allow scroll *within* main if content overflows, but aim to prevent it */}
                  <div className="w-full h-full flex items-center justify-center"> {/* Inner div for centering */}
                     {loading && <LoadingScreen />}
                     {error && <ErrorScreen />}
                     {!loading && !error && (
                         <>
                             {currentPhase === 'welcome' && <WelcomeScreen />}
                             {(currentPhase === 'initial' || currentPhase === 'followup') && <QuestionScreen />}
                             {currentPhase === 'results' && <ResultsScreen />}
                         </>
                     )}
                 </div>
             </main>
         </div>
    );
}
