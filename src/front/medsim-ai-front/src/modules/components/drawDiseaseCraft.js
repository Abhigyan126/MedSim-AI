import { useState, useEffect } from 'react';

export default function MedicalEmbeddings() {
  const [diseases, setDiseases] = useState({});
  const [symptoms, setSymptoms] = useState({});
  const [symptomList, setSymptomList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [targetDisease, setTargetDisease] = useState(null);
  const [prediction, setPrediction] = useState(null); // Current best guess { disease, similarity }
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'finished'
  const [finalResult, setFinalResult] = useState(null); // { isCorrect: bool, grade: string, finalPrediction: object }
  const [score, setScore] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggingSymptom, setDraggingSymptom] = useState(null);
  const [isDraggingOverKadhai, setIsDraggingOverKadhai] = useState(false);

  // Load data on component mount
  useEffect(() => {
    async function loadData() {
      try {
        const [diseasesResponse, symptomsResponse, symptomListResponse] = await Promise.all([
          fetch('/data/diseases.json'),
          fetch('/data/symptoms.json'),
          fetch('/data/symptom_list.json')
        ]);

        const diseasesData = await diseasesResponse.json();
        const symptomsData = await symptomsResponse.json();
        const symptomListData = await symptomListResponse.json();

        setDiseases(diseasesData);
        setSymptoms(symptomsData);
        setSymptomList(symptomListData);
        setLoading(false);

        // Start a new game
        startNewGame(diseasesData); // Pass only diseasesData initially
      } catch (error) {
        console.error("Error loading game data:", error);
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Function to format symptom text for display
  const formatSymptomDisplay = (symptom) => {
    return symptom.replace(/\*/g, ' ');
  };

  // Function to start a new game
  const startNewGame = (currentDiseases = diseases) => { // Removed availableSymptoms default here
    setSelectedSymptoms([]);
    setPrediction(null);
    setGameStatus('playing'); // Reset game status
    setFinalResult(null);     // Reset final result/grade
    setSearchQuery('');       // Clear search

    const diseaseNames = Object.keys(currentDiseases);
    if (diseaseNames.length === 0) {
      console.error("No diseases loaded to start a new game.");
      return;
    }
    const randomDisease = diseaseNames[Math.floor(Math.random() * diseaseNames.length)];

    setTargetDisease(randomDisease);
    console.log("Target disease:", randomDisease);
  };


  // Function to add symptom
  const addSymptom = (symptom) => {
    if (gameStatus === 'finished') return; // Don't allow changes if game is finished

    if (!selectedSymptoms.includes(symptom)) {
      const newSelectedSymptoms = [...selectedSymptoms, symptom];
      setSelectedSymptoms(newSelectedSymptoms);
      predictDiseaseWithSymptoms(newSelectedSymptoms); // Update prediction on add
    }
  };

  // Function to remove symptom
  const removeSymptom = (symptom) => {
    if (gameStatus === 'finished') return; // Don't allow changes if game is finished

    const newSelectedSymptoms = selectedSymptoms.filter(s => s !== symptom);
    setSelectedSymptoms(newSelectedSymptoms);

    // Update prediction on removal, even if list becomes empty
    predictDiseaseWithSymptoms(newSelectedSymptoms);
  };

  // Function to predict disease using given symptoms (updates prediction state)
  const predictDiseaseWithSymptoms = (selectedSymptomsList) => {
    if (selectedSymptomsList.length === 0) {
      setPrediction(null); // Clear prediction if no symptoms
      return;
    }

    const selectedEmbeddings = selectedSymptomsList.map(s => symptoms[s]?.embedding).filter(Boolean);

    if (selectedEmbeddings.length !== selectedSymptomsList.length) {
      console.warn("Some selected symptoms might be missing embeddings.");
    }
    if (selectedEmbeddings.length === 0) {
      setPrediction(null); // No valid embeddings to process
      return;
    }

    const mergedEmbedding = averageEmbeddings(selectedEmbeddings);
    const nearestDisease = findNearestDisease(mergedEmbedding);
    setPrediction(nearestDisease); // Update the current prediction state
  };

  // NEW: Function to finalize the guess and assign a grade
  const handleFinalizeGuess = () => {
      if (gameStatus !== 'playing' || !prediction || selectedSymptoms.length === 0) return; // Can only finalize while playing and with a prediction

      const isCorrect = prediction.disease === targetDisease;
      const similarity = prediction.similarity;
      let grade = 'F'; // Default grade

      if (isCorrect) {
          // Grade based on similarity for correct guesses
          if (similarity >= 0.85) grade = 'A';       // Excellent
          else if (similarity >= 0.70) grade = 'B';  // Good
          else if (similarity >= 0.55) grade = 'C';  // Fair
          else grade = 'D';                           // Correct but Low Confidence
          setScore(prev => prev + 1); // Increment score only on correct finalization
      } else {
          grade = 'F'; // Incorrect guess
      }

      setFinalResult({
          isCorrect: isCorrect,
          grade: grade,
          finalPrediction: prediction // Store the prediction at the time of finalization
      });
      setGameStatus('finished'); // Set game status to finished
  };


  // --- Drag and Drop Handlers ---
  const handleDragStart = (symptom, e) => {
    if (gameStatus === 'finished') return; // Prevent dragging if finished
    setDraggingSymptom(symptom);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    // Check if the target exists before trying to set opacity
    if (e.target) {
       e.target.style.opacity = '1';
    }
    setDraggingSymptom(null);
    setIsDraggingOverKadhai(false);
  };


  const handleDragOver = (e) => {
    if (gameStatus === 'finished') return; // Prevent drop if finished
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDraggingOverKadhai(true);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDraggingOverKadhai(false);
    }
  };


  const handleDrop = (e) => {
    if (gameStatus === 'finished') return; // Prevent drop if finished
    e.preventDefault();
    if (draggingSymptom) {
      addSymptom(draggingSymptom);
      // draggingSymptom state is reset in handleDragEnd
    }
    setIsDraggingOverKadhai(false);
  };

  // Filter symptoms based on search query
  const filteredSymptoms = symptomList.filter(symptom =>
    formatSymptomDisplay(symptom).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Embedding Calculation Functions (Unchanged) ---
  const averageEmbeddings = (embeddings) => {
    if (!embeddings || embeddings.length === 0 || !embeddings[0]) return [];
    const dimension = embeddings[0].length;
    const result = new Array(dimension).fill(0);
    let validEmbeddingsCount = 0; // Initialize count

    for (const embedding of embeddings) {
        if (embedding && embedding.length === dimension) { // Check if embedding is valid
            for (let i = 0; i < dimension; i++) {
                result[i] += embedding[i];
            }
            validEmbeddingsCount++; // Increment count for valid embeddings
        }
    }

    // Check if any valid embeddings were found before dividing
    if (validEmbeddingsCount === 0) return []; // Return empty if no valid embeddings

    for (let i = 0; i < dimension; i++) {
        result[i] /= validEmbeddingsCount;
    }

    // Normalize
    const magnitude = Math.sqrt(result.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return result; // Avoid division by zero

    for (let i = 0; i < dimension; i++) {
        result[i] /= magnitude;
    }
    return result;
  };

  const findNearestDisease = (embedding) => {
    let bestSimilarity = -Infinity;
    let bestDisease = null;

    if (!embedding || embedding.length === 0) {
        return { disease: null, similarity: -Infinity };
    }

    for (const [disease, data] of Object.entries(diseases)) {
        if (data.embedding && data.embedding.length === embedding.length) {
            const similarity = calculateCosineSimilarity(embedding, data.embedding);
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestDisease = disease;
            }
        }
    }

    return {
        disease: bestDisease,
        // Ensure similarity is not NaN or invalid if bestDisease is null
        similarity: bestDisease !== null ? bestSimilarity : -Infinity
    };
  };


  const calculateCosineSimilarity = (vec1, vec2) => {
    if (!vec1 || !vec2 || vec1.length !== vec2.length || vec1.length === 0) {
      return 0;
    }
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    if (mag1 === 0 || mag2 === 0) {
      return 0;
    }
    const similarity = dotProduct / (mag1 * mag2);
    return Math.max(-1, Math.min(1, similarity)); // Clamp
  };

  // --- Grade Display Helper ---
  const getGradeInfo = (grade) => {
    switch (grade) {
      case 'A': return { text: 'Excellent!', color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-300', emoji: '🌟' };
      case 'B': return { text: 'Good Match!', color: 'text-lime-700', bg: 'bg-lime-100', border: 'border-lime-300', emoji: '👍' };
      case 'C': return { text: 'Fair Match', color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-300', emoji: '🤔' };
      case 'D': return { text: 'Correct, Low Confidence', color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-300', emoji: '🧐' };
      case 'F': return { text: 'Incorrect Recipe', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300', emoji: '❌' };
      default: return { text: '', color: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-300', emoji: '' };
    }
  };


  // --- Render Logic ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-amber-50 to-amber-100">
        <div className="text-2xl font-semibold text-amber-700 animate-pulse">
          Loading Medical Recipe Game... 🍲
        </div>
      </div>
    );
  }

  const isGameFinished = gameStatus === 'finished';
  const gradeInfo = finalResult ? getGradeInfo(finalResult.grade) : getGradeInfo(null);

  return (
    <div className="h-[94vh] bg-gradient-to-br from-amber-50 to-amber-100 p-4 overflow-hidden font-sans">
      <div className="h-full max-w-7xl mx-auto flex flex-col">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 text-amber-800 drop-shadow-sm">
          🧪 Medical Recipe Game 🍲
        </h1>

        <div className="flex flex-col md:flex-row gap-4 flex-grow min-h-0">
          {/* Left panel - Symptoms list */}
          <div className={`w-full md:w-1/3 bg-white rounded-xl shadow-lg p-4 flex flex-col border border-amber-200 ${isGameFinished ? 'opacity-70' : ''}`}>
            <h2 className="text-xl font-semibold mb-3 text-amber-700 border-b border-amber-200 pb-2">
              Symptom Ingredients 🧩
            </h2>
            <div className="mb-3 relative">
              <input
                type="text"
                className="w-full p-2 pl-8 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
                placeholder="Search symptoms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isGameFinished} // Disable search when finished
              />
              <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-amber-500">🔍</span>
            </div>
            <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar">
              {filteredSymptoms.sort().map(symptom => (
                <div
                  key={symptom}
                  className={`mb-1.5 p-2 rounded-lg flex items-center text-sm transition-all duration-150 ease-in-out ${
                    selectedSymptoms.includes(symptom)
                      ? 'bg-amber-200 text-amber-800 font-medium cursor-not-allowed' // Style selected items
                      : isGameFinished
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed' // Style disabled items
                      : 'bg-amber-50 hover:bg-amber-100 hover:shadow-sm cursor-grab' // Style available items
                  }`}
                  draggable={!selectedSymptoms.includes(symptom) && !isGameFinished} // Only draggable if not selected and game not finished
                  onDragStart={(e) => !selectedSymptoms.includes(symptom) && !isGameFinished && handleDragStart(symptom, e)}
                  onDragEnd={handleDragEnd} // Still need drag end for cleanup
                  onClick={() => !selectedSymptoms.includes(symptom) && !isGameFinished && addSymptom(symptom)} // Allow clicking to add
                >
                  <span className="mr-2 text-lg">🌡️</span>
                  <span className="flex-grow mr-2">{formatSymptomDisplay(symptom)}</span>
                  {!selectedSymptoms.includes(symptom) && !isGameFinished && (
                    <button
                      title="Add Symptom"
                      className="ml-auto text-amber-600 hover:text-green-600 text-xl font-bold focus:outline-none transition-colors"
                      onClick={(e) => { e.stopPropagation(); addSymptom(symptom); }} // Prevent div click propagation
                      disabled={isGameFinished}
                    >
                      +
                    </button>
                  )}
                </div>
              ))}
              {filteredSymptoms.length === 0 && (
                <p className="text-center text-gray-500 text-sm mt-4">No symptoms found.</p>
              )}
            </div>
          </div>

          {/* Center panel - Kadhai and prediction */}
          <div className="w-full md:w-2/3">
          <div className="bg-white rounded-xl shadow-lg p-4 h-full flex flex-col border border-amber-200 custom-scrollbar">
              {/* Top Section: Score, Target, New Game */}
              <div className="flex justify-between items-start mb-1 gap-4">
                <div className="text-left">
                  <h2 className="text-xl font-semibold text-amber-800">Score: {score}</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {isGameFinished ? "Game finished!" : "Drag symptoms into the pot below"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="p-0 bg-amber-100 rounded-lg text-center shadow-sm border border-amber-200 min-w-[150px]">
                    <p className="font-medium text-xs text-amber-700 uppercase tracking-wider">Target Recipe</p>
                    <p className="text-lg font-bold text-amber-900 break-words">
                      {targetDisease || "Loading..."}
                    </p>
                  </div>
                  <button
                    onClick={() => startNewGame()} // Always allow starting a new game
                    className="bg-amber-600 text-white px-4 py-1 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 text-sm font-medium shadow transition-all hover:shadow-md w-full"
                  >
                    ✨ New Recipe
                  </button>
                </div>
              </div>

              {/* Kadhai (cooking pot) area */}
              <div
                className={`flex-grow relative flex justify-center items-center rounded-lg border-2 ${
                   !isGameFinished && isDraggingOverKadhai ? 'border-dashed border-amber-500 bg-amber-50' : 'border-transparent'
                } transition-all duration-200`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragLeave={handleDragLeave}
              >
                 {/* Container to make SVG slightly bigger */}
                <div className="relative w-full h-full max-w-[450px] max-h-[350px] flex justify-center items-center"> {/* Increased max size */}
                  {/* --- Detailed Kadhai SVG (KEEP SVG CODE AS IS) --- */}
                  <svg
                    viewBox="0 0 400 300"
                    className="w-full h-full"
                    style={{ filter: "drop-shadow(0px 5px 8px rgba(0, 0, 0, 0.25))" }}
                  >
                     {/* --- SVG Content (Flames, Kadhai Body, Handles, Bubbles etc.) --- */}
                     {/* --- Paste the original SVG code here --- */}
                     {/* --- More Detailed Flames --- */}
                    <defs>
                      <radialGradient id="fireGradient" cx="50%" cy="80%" r="70%" fx="50%" fy="80%">
                        <stop offset="0%" stopColor="#FFEDA0" /> {/* Lighter Yellow */}
                        <stop offset="30%" stopColor="#FED976" />
                        <stop offset="60%" stopColor="#FEB24C" />
                        <stop offset="80%" stopColor="#FD8D3C" /> {/* Orange */}
                        <stop offset="95%" stopColor="#FC4E2A" /> {/* Red-Orange */}
                        <stop offset="100%" stopColor="#E31A1C" /> {/* Red */}
                      </radialGradient>
                    </defs>
                    <g className="flames" transform="translate(0 5)"> {/* Moved flames down slightly */}
                      {/* Flame Layer 1 (Back) */}
                      <path fill="url(#fireGradient)" opacity="0.7">
                        <animate attributeName="d" dur="1.8s" repeatCount="indefinite" values="
                          M 150 290 C 160 260, 180 265, 190 240 C 200 215, 210 220, 220 240 C 230 260, 250 265, 260 290 Z;
                          M 150 290 C 155 270, 175 270, 190 250 C 205 230, 215 235, 225 250 C 235 265, 255 270, 260 290 Z;
                          M 150 290 C 160 260, 180 265, 190 240 C 200 215, 210 220, 220 240 C 230 260, 250 265, 260 290 Z;
                        "/>
                        <animate attributeName="opacity" dur="1.8s" repeatCount="indefinite" values="0.7; 0.5; 0.7"/>
                      </path>
                       {/* Flame Layer 2 (Middle) */}
                      <path fill="url(#fireGradient)" opacity="0.9">
                         <animate attributeName="d" dur="1.5s" repeatCount="indefinite" values="
                          M 170 290 C 175 255, 190 260, 200 230 C 210 200, 220 205, 230 230 C 240 255, 250 260, 255 290 Z;
                          M 170 290 C 180 265, 190 270, 200 240 C 210 210, 225 215, 235 240 C 245 265, 250 270, 255 290 Z;
                          M 170 290 C 175 255, 190 260, 200 230 C 210 200, 220 205, 230 230 C 240 255, 250 260, 255 290 Z;
                         "/>
                         <animate attributeName="opacity" dur="1.5s" repeatCount="indefinite" values="0.9; 0.7; 0.9"/>
                      </path>
                       {/* Flame Layer 3 (Front) */}
                      <path fill="url(#fireGradient)" opacity="0.8">
                         <animate attributeName="d" dur="1.2s" repeatCount="indefinite" values="
                          M 190 290 C 195 265, 205 270, 210 250 C 215 230, 225 235, 230 250 C 235 265, 240 270, 245 290 Z;
                          M 190 290 C 193 270, 205 275, 210 255 C 215 235, 228 240, 233 255 C 238 270, 242 275, 245 290 Z;
                          M 190 290 C 195 265, 205 270, 210 250 C 215 230, 225 235, 230 250 C 235 265, 240 270, 245 290 Z;
                         "/>
                          <animate attributeName="opacity" dur="1.2s" repeatCount="indefinite" values="0.8; 0.6; 0.8"/>
                      </path>
                    </g>

                    {/* --- Detailed Kadhai Body --- */}
                    <defs>
                      {/* Gradient for metal (brass/bronze look) */}
                      <linearGradient id="kadhaiMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#d4af37" /> {/* Gold-ish */}
                        <stop offset="30%" stopColor="#b8860b" /> {/* Dark Goldenrod */}
                        <stop offset="70%" stopColor="#cd853f" /> {/* Peru */}
                        <stop offset="100%" stopColor="#8b4513" /> {/* Saddle Brown (shadow) */}
                      </linearGradient>
                       {/* Gradient for inner part (darker, reflects less) */}
                       <radialGradient id="kadhaiInner" cx="50%" cy="50%" r="60%">
                         <stop offset="0%" stopColor="#6B4F34" /> {/* Darker brown */}
                         <stop offset="70%" stopColor="#4A3728" />
                         <stop offset="100%" stopColor="#3B2D1F" />
                      </radialGradient>
                      {/* Gradient for Bubbles */}
                       <radialGradient id="bubbleGradient" cx="40%" cy="40%" r="50%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                        <stop offset="100%" stopColor="rgba(255,218,185,0.4)" /> {/* Peach Puff transparent */}
                      </radialGradient>
                    </defs>

                     {/* Kadhai Rim (Top Ellipse) */}
                    <ellipse cx="200" cy="100" rx="130" ry="35" fill="url(#kadhaiMetal)" stroke="#715a3a" strokeWidth="5" />

                     {/* Kadhai Body (Curved Path) - Adjusted path for a rounder bottom */}
                     <path d="M 70 100 C 70 100, 50 180, 100 230 Q 200 280, 300 230 C 350 180, 330 100, 330 100 Z"
                           fill="url(#kadhaiMetal)" stroke="#715a3a" strokeWidth="5" />

                     {/* Inner Surface */}
                    <ellipse cx="200" cy="100" rx="120" ry="30" fill="url(#kadhaiInner)" />
                    <path d="M 80 100 C 80 100, 65 170, 105 215 Q 200 260, 295 215 C 335 170, 320 100, 320 100 Z"
                           fill="url(#kadhaiInner)" opacity="0.8" />


                     {/* Handles (Thicker and slightly curved) */}
                    <path d="M 68 100 C 20 90, 20 130, 75 125" stroke="#715a3a" strokeWidth="12" fill="none" strokeLinecap="round"/>
                    <path d="M 332 100 C 380 90, 380 130, 325 125" stroke="#715a3a" strokeWidth="12" fill="none" strokeLinecap="round"/>

                    {/* Subtle Highlights */}
                    <ellipse cx="150" cy="90" rx="60" ry="12" fill="rgba(255, 255, 255, 0.25)" transform="rotate(-10 150 90)" />
                    <ellipse cx="250" cy="115" rx="40" ry="8" fill="rgba(255, 255, 255, 0.15)" transform="rotate(5 250 115)"/>

                    {/* Animated Bubbles inside the Kadhai */}
                    {selectedSymptoms.length > 0 && ( // Only show bubbles if there are symptoms
                        <>
                            <circle cx="180" cy="140" r="8" fill="url(#bubbleGradient)">
                                <animate attributeName="cy" values="140;110;140" dur="3s" repeatCount="indefinite" />
                                <animate attributeName="cx" values="180;190;180" dur="4s" repeatCount="indefinite" />
                                <animate attributeName="r" values="8;11;8" dur="3s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="220" cy="130" r="6" fill="url(#bubbleGradient)">
                                <animate attributeName="cy" values="130;115;130" dur="2.5s" repeatCount="indefinite" />
                                <animate attributeName="cx" values="220;210;220" dur="3.5s" repeatCount="indefinite" />
                                <animate attributeName="r" values="6;9;6" dur="2.5s" repeatCount="indefinite" />
                            </circle>
                             <circle cx="150" cy="155" r="5" fill="url(#bubbleGradient)">
                                <animate attributeName="cy" values="155;120;155" dur="3.8s" repeatCount="indefinite" />
                                <animate attributeName="cx" values="150;165;150" dur="4.2s" repeatCount="indefinite" />
                                <animate attributeName="r" values="5;7;5" dur="3.8s" repeatCount="indefinite" />
                            </circle>
                             <circle cx="250" cy="145" r="7" fill="url(#bubbleGradient)">
                                <animate attributeName="cy" values="145;125;145" dur="2.8s" repeatCount="indefinite" />
                                <animate attributeName="cx" values="250;240;250" dur="3.8s" repeatCount="indefinite" />
                                <animate attributeName="r" values="7;10;7" dur="2.8s" repeatCount="indefinite" />
                            </circle>
                        </>
                    )}
                  </svg>

                  {/* Overlay for selected symptoms */}
                  <div className="absolute inset-0 flex flex-wrap justify-center items-center content-start pt-16 px-10 pb-10 overflow-hidden pointer-events-none">
                    {selectedSymptoms.map((symptom, index) => (
                      <div
                        key={`${symptom}-${index}`}
                        className={`bg-white bg-opacity-80 backdrop-blur-sm text-amber-900 px-2.5 py-1 m-1 rounded-full text-xs flex items-center shadow-md ${!isGameFinished ? 'pointer-events-auto' : ''}`} // Enable pointer events only if game not finished
                        style={{
                          animationName: !isGameFinished ? 'float' : 'none', // Stop animation when finished
                          animationDuration: `${2.5 + Math.random() * 2}s`,
                          animationDelay: `${Math.random() * 0.5}s`,
                          animationIterationCount: 'infinite',
                          animationDirection: 'alternate',
                          animationTimingFunction: 'ease-in-out'
                        }}
                      >
                        <span className="mr-1.5">🌡️</span>
                        <span className="whitespace-nowrap">{formatSymptomDisplay(symptom)}</span>
                        {!isGameFinished && ( // Only show remove button if game not finished
                          <button
                            onClick={() => removeSymptom(symptom)}
                            className="ml-1.5 text-red-500 hover:text-red-700 font-bold focus:outline-none text-sm leading-none"
                            disabled={isGameFinished}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Kadhai Messages */}
                    {selectedSymptoms.length === 0 && !isDraggingOverKadhai && !isGameFinished && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center text-xs sm:text-sm bg-black bg-opacity-40 p-2 rounded-md shadow-lg pointer-events-none">
                        Drag & Drop Symptoms Here
                      </div>
                    )}
                    {!isGameFinished && isDraggingOverKadhai && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-amber-900 text-center text-sm sm:text-base font-semibold bg-amber-200 bg-opacity-70 p-3 rounded-lg shadow-lg pointer-events-none">
                        Drop to add!
                      </div>
                    )}
                     {isGameFinished && finalResult && (
                         <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-lg sm:text-xl font-bold ${gradeInfo.bg} ${gradeInfo.color} p-4 rounded-lg shadow-xl pointer-events-none border ${gradeInfo.border}`}>
                            Grade: {finalResult.grade} <span className="ml-1">{gradeInfo.emoji}</span>
                            <p className="text-sm font-normal mt-1">{gradeInfo.text}</p>
                         </div>
                     )}
                  </div>
                </div>
              </div>

              {/* Prediction/Result area at bottom */}
               {/* Finalize Button - Shown only when playing and symptoms selected */}
               {!isGameFinished && selectedSymptoms.length > 0 && (
                <div className="mt-3 text-center">
                    <button
                        onClick={handleFinalizeGuess}
                        disabled={!prediction} // Disable if no prediction is available yet
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 text-base font-medium shadow transition-all hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        🥣 Finalize Recipe!
                    </button>
                </div>
               )}

              {/* Prediction/Result Display */}
              <div className={`p-3 rounded-lg mt-3 text-center transition-all duration-300 ease-in-out ${
                isGameFinished
                  ? `${gradeInfo.bg} border ${gradeInfo.border} shadow-md` // Use grade colors when finished
                  : prediction
                  ? 'bg-amber-100 border border-amber-200 shadow-sm' // Use amber when playing and prediction exists
                  : 'h-0 p-0 border-none opacity-0 invisible' // Hide smoothly if no prediction and not finished
              }`}>
                {/* Display Final Result OR Current Prediction */}
                {(isGameFinished && finalResult) ? (
                  // Final Result Display
                  <>
                     <div className="flex justify-between items-center mb-1">
                       <h3 className={`font-semibold text-sm ${gradeInfo.color}`}>
                         Final Result (Grade: {finalResult.grade} {gradeInfo.emoji})
                       </h3>
                       <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${gradeInfo.bg} ${gradeInfo.color} border ${gradeInfo.border}`}>
                         Match: {(finalResult.finalPrediction.similarity * 100).toFixed(1)}%
                       </span>
                     </div>
                     <p className={`text-xl font-bold break-words ${gradeInfo.color}`}>
                       {finalResult.finalPrediction.disease}
                     </p>
                     <p className={`text-sm font-medium mt-2 ${gradeInfo.color}`}>
                        {gradeInfo.text}
                        {finalResult.isCorrect ? ' (Target was: '+targetDisease+')' : ' (Target was: '+targetDisease+')'}
                     </p>
                  </>
                ) : prediction ? (
                   // Current Prediction Display (while playing)
                    <>
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-semibold text-sm text-gray-700">
                          Current Brew Prediction:
                        </h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-amber-200 text-amber-800`}>
                          Confidence: {(prediction.similarity * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className={`text-xl font-bold break-words text-amber-800`}>
                        {prediction.disease}
                      </p>
                      {prediction.disease !== targetDisease && (
                           <p className="text-xs text-blue-600 mt-1 italic">Keep adding ingredients or finalize your guess!</p>
                      )}
                       {prediction.disease === targetDisease && (
                           <p className="text-xs text-green-600 mt-1 italic">Looks like the right recipe! Add more for higher confidence or finalize.</p>
                      )}
                    </>
                ) : null /* End of conditional display */}
              </div>
            </div>
          </div>
        </div>

        {/* Add floating animation keyframes */}
        <style jsx>{`
          @keyframes float {
            0% { transform: translateY(0px) rotate(-2deg); }
            50% { transform: translateY(-8px) rotate(0deg); }
            100% { transform: translateY(0px) rotate(2deg); }
          }

          /* Basic scrollbar styling (optional) - KEEP AS IS */
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #f9f5eb; border-radius: 3px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #e4c38a; border-radius: 3px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1ae6b; }
          .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #e4c38a #f9f5eb; }
        `}</style>
      </div>
    </div>
  );
}
