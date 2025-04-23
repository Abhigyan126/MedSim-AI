import React, { useRef, useState, useEffect, useCallback } from "react";
import "../../styles/blob.css";
import API from "./api";
import { Heart, Info, MessageSquare, Send, Eye, RefreshCw, Edit, Save, User, Shuffle } from 'lucide-react';
import { handleKeyDown } from "./handle_enter";
import giveRandomDisease from "./random_disease";
import { Search, MessageCircle, Sparkles, RotateCcw, ChevronDown } from 'lucide-react';
import BarGraph from "./bargraph";



// --- Constants ---
const ORIGINAL_WIDTH = 900;
const ORIGINAL_HEIGHT = 550;
const BOX_WIDTH = 130;
const BOX_HEIGHT = 90;

// --- Dark Theme Colors ---
const DARK_THEME_BG = "bg-black";
const DARK_THEME_TEXT = "text-gray-200";
const PANEL_BG = "bg-gray-800";
const PANEL_BORDER = "border-gray-700";
const TEXT_COLOR_CANVAS = "#E5E7EB"; // Light gray for canvas text
const LINE_COLOR_DARK = "rgba(255, 255, 255, 0.8)"; // Gray-400 with opacity
const SELECTED_BORDER_COLOR_DARK = "#3B82F6"; // Blue-500
const DEFAULT_BORDER_COLOR_DARK = "#6B7280"; // Gray-500
const HOVER_BORDER_COLOR_DARK = "#9CA3AF"; // Gray-400

// Adjusted Severity Colors for Dark Background (Brighter/Higher Contrast)
const SEVERITY_COLORS_DARK = [
    "rgba(180, 180, 90, 0.9)",  // Softer Yellow (1)
    "rgba(200, 140, 70, 0.9)",  // Softer Orange (2)
    "rgba(180, 90, 50, 0.9)",   // Softer Red-Orange (3)
    "rgba(160, 50, 50, 0.9)",   // Softer Red (4)
    "rgba(140, 40, 40, 0.9)",   // Softer Dark Red (5)
];


// Star colors matching severity for better visual cue
const SEVERITY_STAR_COLORS_DARK = [
    "#FFD700", // **Gold (More Visible)**
    "#FFB347", // **Soft Golden Orange**
    "#FF6F61", // **Salmon Pink (Balanced)**
    "#FF3B3B", // **Bright Red**
    "#C53030", // **Deep Blood Red**
];

const MAX_OVERLAP_ADJUST_ATTEMPTS = 50;
const OVERLAP_ADJUST_STEP = 5;

// --- No Spawn Zone ---
const NO_SPAWN_ZONE_WIDTH = BOX_WIDTH + 100; // Box width + padding
const NO_SPAWN_ZONE_LEFT = (ORIGINAL_WIDTH - NO_SPAWN_ZONE_WIDTH) / 2;
const NO_SPAWN_ZONE_RIGHT = NO_SPAWN_ZONE_LEFT + NO_SPAWN_ZONE_WIDTH;
const NO_SPAWN_ZONE_PUSH_MARGIN = 15; // How far to push away from the zone edge


function SymptomVisualizer({ coordinatesData = []}) {
  const [symptomsData, setSymptomsData] = useState([]);
  const [activeButton, setActiveButton] = useState(null); // states: info chatbot submit view
  const canvasRef = useRef(null);
  const containerRef = useRef(null); // Ref for the main container for potential future use
  const leftColRef = useRef(null); // Ref for the left column containing canvas
  const [symptomBoxes, setSymptomBoxes] = useState([]);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [selectedBoxIndex, setSelectedBoxIndex] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reportResult, setReportResult] = useState(null);
  const [submittedText, setSubmittedText] = useState('');
  const [ReportData, setReportData] = useState('');
  const [isSubmitted,setIsSubmitted] = useState(false);
  const [Fdisease, SetFdisease] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChatbotLoading, setIschatbotLoading] = useState(false);





  // --- Helper Functions ---

  const getColorBySeverity = useCallback((severity) => {
    const index = Math.min(Math.max(Math.floor(severity || 1) - 1, 0), SEVERITY_COLORS_DARK.length - 1);
    return SEVERITY_COLORS_DARK[index];
  }, []);

   const getStarColorBySeverity = useCallback((severity) => {
      const index = Math.min(Math.max(Math.floor(severity || 1) - 1, 0), SEVERITY_STAR_COLORS_DARK.length - 1);
      return SEVERITY_STAR_COLORS_DARK[index];
   }, []);

  const boxesOverlap = useCallback((box1, box2) => {
    const buffer = 2;
    return (
      box1.x < box2.x + BOX_WIDTH + buffer &&
      box1.x + BOX_WIDTH + buffer > box2.x &&
      box1.y < box2.y + BOX_HEIGHT + buffer &&
      box1.y + BOX_HEIGHT + buffer > box2.y
    );
  }, []);

 // --- Overlap Prevention ---
 const preventOverlap = useCallback((boxes) => {
  const adjustedBoxes = [...boxes];
  let changed = true;
  let loops = 0;
  // Increase max loops slightly as adjustments might be more complex
  const MAX_LOOPS = (MAX_OVERLAP_ADJUST_ATTEMPTS || 10) * adjustedBoxes.length * 1.5;
  const VERTICAL_BIAS_FACTOR = 0.3; // How much vertical push to add for horizontal overlaps (0 to 1)
  const SIDE_PUSH_FACTOR = 1.1; // Multiplier for horizontal push near center (1 = no change)
  const CENTER_ZONE_WIDTH_RATIO = 0.3; // How much of the center width triggers side push (e.g., 30%)

  // Helper to constrain a box position, respecting bounds and no-spawn zone
  const constrainBoxPosition = (box) => {
      const clampedX = Math.max(0, Math.min(ORIGINAL_WIDTH - BOX_WIDTH, box.x));
      const clampedY = Math.max(0, Math.min(ORIGINAL_HEIGHT - BOX_HEIGHT, box.y));
      let finalX = clampedX;
      const finalY = clampedY;

      // Apply No-Spawn Zone constraint *after* clamping to general bounds
      const boxRightEdge = finalX + BOX_WIDTH;
      if (NO_SPAWN_ZONE_LEFT !== undefined && NO_SPAWN_ZONE_RIGHT !== undefined && boxRightEdge > NO_SPAWN_ZONE_LEFT && finalX < NO_SPAWN_ZONE_RIGHT) {
           const boxCenterX = finalX + BOX_WIDTH / 2;
           const pushMargin = NO_SPAWN_ZONE_PUSH_MARGIN !== undefined ? NO_SPAWN_ZONE_PUSH_MARGIN : 5;

           // Push out towards the *nearest* edge of the no-spawn zone
           if (boxCenterX < (NO_SPAWN_ZONE_LEFT + NO_SPAWN_ZONE_RIGHT) / 2) {
                // Closer to left edge of zone
                finalX = NO_SPAWN_ZONE_LEFT - BOX_WIDTH - pushMargin;
           } else {
                // Closer to right edge of zone
                finalX = NO_SPAWN_ZONE_RIGHT + pushMargin;
           }
           // Re-clamp X after potential push, ensuring it stays within canvas
           finalX = Math.max(0, Math.min(ORIGINAL_WIDTH - BOX_WIDTH, finalX));
      }

      return { ...box, x: finalX, y: finalY };
  };


  while (changed && loops < MAX_LOOPS) {
    changed = false;
    loops++;
    // --- Standard Overlap Resolution ---
    for (let i = 0; i < adjustedBoxes.length; i++) {
      for (let j = i + 1; j < adjustedBoxes.length; j++) {
        if (boxesOverlap(adjustedBoxes[i], adjustedBoxes[j])) {
          changed = true;
          const boxI = adjustedBoxes[i];
          const boxJ = adjustedBoxes[j];

          const dx = (boxJ.x + BOX_WIDTH / 2) - (boxI.x + BOX_WIDTH / 2);
          const dy = (boxJ.y + BOX_HEIGHT / 2) - (boxI.y + BOX_HEIGHT / 2);
          const distance = Math.sqrt(dx * dx + dy * dy) || 1; // Prevent division by zero

          // Calculate base movement vector normalized
          let normX = dx / distance;
          let normY = dy / distance;

          // --- Add Vertical Bias to break horizontal lines ---
          // If movement is mostly horizontal, add a small vertical component
          if (Math.abs(normX) > 0.85) { // Check if vectors are mostly horizontal
               const verticalNudge = (Math.random() < 0.5 ? 1 : -1) * VERTICAL_BIAS_FACTOR;
               // Adjust normY and re-normalize (approximately)
               normY += verticalNudge;
               const newMag = Math.sqrt(normX*normX + normY*normY) || 1;
               normX /= newMag;
               normY /= newMag;
          }

          // Calculate the actual movement distance
          let moveAmount = OVERLAP_ADJUST_STEP;

          // --- Add Side Clinging Bias (Push outwards from center) ---
          const centerZoneLeft = ORIGINAL_WIDTH * (0.5 - CENTER_ZONE_WIDTH_RATIO / 2);
          const centerZoneRight = ORIGINAL_WIDTH * (0.5 + CENTER_ZONE_WIDTH_RATIO / 2);
          const boxICenterX = boxI.x + BOX_WIDTH / 2;
          const boxJCenterX = boxJ.x + BOX_WIDTH / 2;

          // If either box is significantly in the central zone
          if ((boxICenterX > centerZoneLeft && boxICenterX < centerZoneRight) ||
              (boxJCenterX > centerZoneLeft && boxJCenterX < centerZoneRight))
          {
               // Increase the horizontal component of the push slightly
               // This makes them move more left/right when resolving overlaps in the middle
               if (Math.abs(normX) > 0.1) { // Only if there's some horizontal component already
                    normX *= SIDE_PUSH_FACTOR;
                    // Re-normalize (approximately) after bias
                    const biasedMag = Math.sqrt(normX*normX + normY*normY) || 1;
                    normX /= biasedMag;
                    normY /= biasedMag;
               }
          }


          // Apply calculated movement based on final normalized direction and step
          const moveX = normX * moveAmount;
          const moveY = normY * moveAmount;

          // Apply movement tentatively
          adjustedBoxes[i].x -= moveX / 2;
          adjustedBoxes[i].y -= moveY / 2;
          adjustedBoxes[j].x += moveX / 2;
          adjustedBoxes[j].y += moveY / 2;

          // Apply constraints immediately after adjusting a pair
          adjustedBoxes[i] = constrainBoxPosition(adjustedBoxes[i]);
          adjustedBoxes[j] = constrainBoxPosition(adjustedBoxes[j]);
        }
      }
    }
  }

   // Final constraint pass after all loops (safety net)
   for (let i = 0; i < adjustedBoxes.length; i++) {
         adjustedBoxes[i] = constrainBoxPosition(adjustedBoxes[i]);
   }

  if (loops >= MAX_LOOPS) {
     console.warn("Overlap prevention iteration limit reached. Layout might not be optimal.");
  }
  return adjustedBoxes;
  // Ensure necessary constants are available in scope (e.g., NO_SPAWN_ZONE_LEFT/RIGHT/PUSH_MARGIN, OVERLAP_ADJUST_STEP, BOX_WIDTH/HEIGHT, ORIGINAL_WIDTH/HEIGHT)
}, [boxesOverlap]); // Add dependencies like NO_SPAWN_ZONE constants if they are props/state

  // --- Initialization Effect ---
  useEffect(() => {
    if (coordinatesData.length === 0 || symptomsData.length === 0) {
      setSymptomBoxes([]);
      return;
    }

    const bodyParts = coordinatesData.reduce((acc, item) => {
      acc[item.name.toLowerCase()] = item;
      return acc;
    }, {});

    // --- Group symptoms by location to handle initial placement ---
    const symptomsByLocation = symptomsData.reduce((acc, symptom, index) => {
        const locKey = symptom.location?.toLowerCase() || 'unknown_location';
        if (!acc[locKey]) {
            acc[locKey] = [];
        }
        // Store the original symptom data along with its index
        acc[locKey].push({ ...symptom, originalIndex: index });
        return acc;
    }, {});

    const initialBoxes = [];
    const INITIAL_SPREAD_RADIUS = 35; // Increase for more initial spread
    const MIN_ANGLE_SPREAD = Math.PI / 3; // Minimum angle (60 deg) to spread over
    const MAX_ANGLE_SPREAD = Math.PI * 1.2; // Maximum angle (216 deg)

    Object.values(symptomsByLocation).forEach(group => {
      if (group.length === 0) return;

      const firstSymptom = group[0]; // Assume all in group share location/bodyPart
      const bodyPart = bodyParts[firstSymptom.location?.toLowerCase()];
      let baseX, baseY;

      // Determine the base anchor point for the group
      if (bodyPart?.target) {
        baseX = bodyPart.target.x;
        baseY = bodyPart.target.y; // Anchor at the target itself
      } else if (bodyPart?.label) {
        baseX = bodyPart.label.x;
        baseY = bodyPart.label.y; // Anchor at the label
      } else {
        // Fallback: random position if no body part found
        baseX = Math.random() * (ORIGINAL_WIDTH - BOX_WIDTH);
        baseY = Math.random() * (ORIGINAL_HEIGHT - BOX_HEIGHT);
      }

      const numBoxesInGroup = group.length;
      // Calculate spread angle based on number of boxes, capped between MIN and MAX
      const totalAngle = Math.min(MAX_ANGLE_SPREAD, Math.max(MIN_ANGLE_SPREAD, numBoxesInGroup * (Math.PI / 6))); // Adjust multiplier as needed
      const angleStep = numBoxesInGroup > 1 ? totalAngle / (numBoxesInGroup -1 ) : 0;
      // Start angle slightly offset to center the arc (e.g., pointing upwards/outwards)
      const startAngle = -Math.PI / 2 - totalAngle / 2;

      group.forEach((symptom, index) => {
        let initialPosX, initialPosY;
        const radius = numBoxesInGroup > 1 ? INITIAL_SPREAD_RADIUS + (index * 5) : 0; // Slightly increase radius for outer boxes

        if (numBoxesInGroup === 1) {
          // Single box: Place it near the target, slightly offset upwards
          initialPosX = baseX - BOX_WIDTH / 2;
          initialPosY = baseY - BOX_HEIGHT - 15; // Standard initial offset upwards
        } else {
          // Multiple boxes: Spread them in an arc around the base point
          const angle = startAngle + (index * angleStep);
          const offsetX = Math.cos(angle) * radius;
          const offsetY = Math.sin(angle) * radius - BOX_HEIGHT/2; // Apply offset relative to base, slightly raise the center

          initialPosX = baseX + offsetX - BOX_WIDTH / 2;
          initialPosY = baseY + offsetY;
        }

        // --- Start: No Spawn Zone Adjustment (Applied after initial spread) ---
        let adjustedPosX = initialPosX;
        const boxRightEdge = initialPosX + BOX_WIDTH;
        if (NO_SPAWN_ZONE_LEFT !== undefined && NO_SPAWN_ZONE_RIGHT !== undefined && boxRightEdge > NO_SPAWN_ZONE_LEFT && initialPosX < NO_SPAWN_ZONE_RIGHT) {
            const boxCenterX = initialPosX + BOX_WIDTH / 2;
            const pushDirection = (boxCenterX < ORIGINAL_WIDTH / 2) ? -1 : 1; // -1 left, 1 right
            const pushMargin = NO_SPAWN_ZONE_PUSH_MARGIN !== undefined ? NO_SPAWN_ZONE_PUSH_MARGIN : 5;
            const randomPush = Math.floor(Math.random() * 15); // Reduced randomness

            adjustedPosX = (pushDirection === -1)
               ? NO_SPAWN_ZONE_LEFT - BOX_WIDTH - pushMargin - randomPush
               : NO_SPAWN_ZONE_RIGHT + pushMargin + randomPush;
        }
        // --- End: No Spawn Zone Adjustment ---

        // Clamp final initial position to canvas bounds
        let finalPosX = Math.max(5, Math.min(ORIGINAL_WIDTH - BOX_WIDTH - 5, adjustedPosX));
        let finalPosY = Math.max(5, Math.min(ORIGINAL_HEIGHT - BOX_HEIGHT - 5, initialPosY));

        initialBoxes.push({
          id: symptom.originalIndex, // Use original index for consistent ID if needed elsewhere
          name: symptom.name || "Unknown Symptom",
          description: symptom.description || "",
          severity: symptom.severity || 1,
          location: symptom.location || "Unknown",
          x: finalPosX,
          y: finalPosY,
          color: getColorBySeverity(symptom.severity || 1),
          initialBodyPart: bodyPart // Keep reference to original body part
        });
      });
    });

    // Sort boxes by original index if order matters before overlap prevention
    initialBoxes.sort((a, b) => a.id - b.id);

    const adjustedBoxes = preventOverlap(initialBoxes); // Prevent overlap *after* initial placement/spreading
    setSymptomBoxes(adjustedBoxes);
    setSelectedBoxIndex(null);

    // Make sure constants are defined (example values, adjust as needed)
    // const NO_SPAWN_ZONE_LEFT = ORIGINAL_WIDTH * 0.4;
    // const NO_SPAWN_ZONE_RIGHT = ORIGINAL_WIDTH * 0.6;
    // const NO_SPAWN_ZONE_PUSH_MARGIN = 10;

  }, [coordinatesData, symptomsData, getColorBySeverity, preventOverlap]); // Add constants like NO_SPAWN_ZONE if they are props or state

  // --- Resize Effect (Scales the Left Column) ---
  useEffect(() => {
    const handleResize = () => {
      const container = leftColRef.current;
      if (!container) return;
      const containerWidth = container.clientWidth;
      const newScale = Math.min(1, containerWidth / ORIGINAL_WIDTH);
      setScale(newScale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let resizeObserver;
    const currentLeftColRef = leftColRef.current; // Store the current ref value

    if (window.ResizeObserver && currentLeftColRef) {
        resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(currentLeftColRef);
    }

    return () => {
        if (resizeObserver && currentLeftColRef) {
            resizeObserver.unobserve(currentLeftColRef);
        } else {
            window.removeEventListener('resize', handleResize);
        }
    };
}, []);

  // --- Mouse Event Handlers ---

  const getMousePos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;
    return { x: mouseX, y: mouseY };
  }, [scale]);

  const handleMouseDown = useCallback((e) => {
    const { x: mouseX, y: mouseY } = getMousePos(e);
    let clickedOriginalIndex = -1; // Store the index in the *current* array

    // Find the box clicked (iterate backwards for top-most box)
    for (let i = symptomBoxes.length - 1; i >= 0; i--) {
      const box = symptomBoxes[i];
      if (
        mouseX >= box.x && mouseX <= box.x + BOX_WIDTH &&
        mouseY >= box.y && mouseY <= box.y + BOX_HEIGHT
      ) {
        clickedOriginalIndex = i;
        break;
      }
    }

    if (clickedOriginalIndex !== -1) {
      const clickedBox = symptomBoxes[clickedOriginalIndex];
      const newBoxes = [
        ...symptomBoxes.filter((_, idx) => idx !== clickedOriginalIndex),
        clickedBox
      ];
      const newIndex = newBoxes.length - 1;
      setSymptomBoxes(newBoxes);
      setSelectedBoxIndex(newIndex);
      setDraggingIndex(newIndex);
      setDragOffset({ x: mouseX - clickedBox.x, y: mouseY - clickedBox.y });

    } else {
      setSelectedBoxIndex(null);
    }
  }, [getMousePos, symptomBoxes]);

  const handleMouseMove = useCallback((e) => {
    const { x: mouseX, y: mouseY } = getMousePos(e);
    const canvas = canvasRef.current;
    if(!canvas) return;

    let currentHoveredIndex = -1;
    let isOverBox = false;

    for (let i = symptomBoxes.length - 1; i >= 0; i--) {
        const box = symptomBoxes[i];
        if (
            mouseX >= box.x && mouseX <= box.x + BOX_WIDTH &&
            mouseY >= box.y && mouseY <= box.y + BOX_HEIGHT
        ) {
            currentHoveredIndex = i;
            isOverBox = true;
            break;
        }
    }
    setHoveredIndex(currentHoveredIndex);

    if (draggingIndex !== null && draggingIndex < symptomBoxes.length) {
      const newX = mouseX - dragOffset.x;
      const newY = mouseY - dragOffset.y;
      const margin = 2;
      const boundedX = Math.max(margin, Math.min(ORIGINAL_WIDTH - BOX_WIDTH - margin, newX));
      const boundedY = Math.max(margin, Math.min(ORIGINAL_HEIGHT - BOX_HEIGHT - margin, newY));

      setSymptomBoxes(prevBoxes => {
          const updatedBoxes = [...prevBoxes];
          if (draggingIndex < updatedBoxes.length) {
              updatedBoxes[draggingIndex] = {
                ...updatedBoxes[draggingIndex],
                x: boundedX,
                y: boundedY
              };
          }
          return updatedBoxes;
      });
       canvas.style.cursor = 'grabbing';
    } else {
        canvas.style.cursor = isOverBox ? 'grab' : 'default';
    }

  }, [draggingIndex, dragOffset, getMousePos, symptomBoxes]); // Added symptomBoxes

  const handleMouseUp = useCallback(() => {
    if (draggingIndex !== null) {
      setSymptomBoxes(prevBoxes => preventOverlap(prevBoxes));
      setDraggingIndex(null);
       // Reset cursor based on potential hover state after dropping
       const canvas = canvasRef.current;
       if(canvas) canvas.style.cursor = hoveredIndex !== -1 ? 'grab' : 'default';
    }
  }, [draggingIndex, preventOverlap, hoveredIndex]); // Added hoveredIndex

   const handleMouseLeave = useCallback(() => {
        if (draggingIndex !== null) {
             setSymptomBoxes(prevBoxes => preventOverlap(prevBoxes));
             setDraggingIndex(null);
        }
        setHoveredIndex(null);
        const canvas = canvasRef.current;
        if(canvas) canvas.style.cursor = 'default';
   }, [draggingIndex, preventOverlap]);

   // --- Geometry Helper for Line Connection ---
   const getLineBoxIntersection = (targetX, targetY, box) => {
        const boxCenterX = box.x + BOX_WIDTH / 2;
        const boxCenterY = box.y + BOX_HEIGHT / 2;
        const dx = targetX - boxCenterX;
        const dy = targetY - boxCenterY;

        // Avoid division by zero or near-zero
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
            return { x: boxCenterX, y: boxCenterY }; // Target is essentially at the center
        }

        let t = Infinity;

        // Check intersection with box edges using parametric line equation P = C + t*D
        // Calculate 't' values for intersection with each edge plane
        if (dx !== 0) {
            t = Math.min(t, Math.max((box.x - boxCenterX) / dx, (box.x + BOX_WIDTH - boxCenterX) / dx));
        }
        if (dy !== 0) {
            t = Math.min(t, Math.max((box.y - boxCenterY) / dy, (box.y + BOX_HEIGHT - boxCenterY) / dy));
        }

        if (!isFinite(t) || t < 0) { // Fallback if calculation fails or target inside
             const clampedX = Math.max(box.x, Math.min(targetX, box.x + BOX_WIDTH));
             const clampedY = Math.max(box.y, Math.min(targetY, box.y + BOX_HEIGHT));
             const distToLeft = Math.abs(targetX - box.x);
             const distToRight = Math.abs(targetX - (box.x + BOX_WIDTH));
             const distToTop = Math.abs(targetY - box.y);
             const distToBottom = Math.abs(targetY - (box.y + BOX_HEIGHT));
             const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

             if (minDist === distToTop) return { x: clampedX, y: box.y };
             if (minDist === distToBottom) return { x: clampedX, y: box.y + BOX_HEIGHT };
             if (minDist === distToLeft) return { x: box.x, y: clampedY };
             return { x: box.x + BOX_WIDTH, y: clampedY };
        }

        const intersectX = boxCenterX + t * dx;
        const intersectY = boxCenterY + t * dy;

        // Clamp to box boundary precisely
        return {
            x: Math.max(box.x, Math.min(intersectX, box.x + BOX_WIDTH)),
            y: Math.max(box.y, Math.min(intersectY, box.y + BOX_HEIGHT)),
        };
   };

  // --- Drawing Effect ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    canvas.width = ORIGINAL_WIDTH * scale;
    canvas.height = ORIGINAL_HEIGHT * scale;
    ctx.scale(scale, scale);
    ctx.clearRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

    // --- Draw Connection Lines (Behind Boxes) ---
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = LINE_COLOR_DARK; // Use dark theme line color
    symptomBoxes.forEach(box => {
      const bodyPart = box.initialBodyPart;
      if (bodyPart?.target) {
        const targetX = bodyPart.target.x;
        const targetY = bodyPart.target.y;
        const endPoint = getLineBoxIntersection(targetX, targetY, box);

        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
         const controlX = (targetX + endPoint.x) / 2 + (targetY - endPoint.y) * 0.1;
         const controlY = (targetY + endPoint.y) / 2 + (endPoint.x - targetX) * 0.1;
         ctx.quadraticCurveTo(controlX, controlY, endPoint.x, endPoint.y);
        ctx.stroke();
      }
    });
    ctx.restore();

    // --- Draw Symptom Boxes (On Top of Lines) ---
    symptomBoxes.forEach((box, index) => {
      const isSelected = index === selectedBoxIndex;
      const isHovered = index === hoveredIndex;

      ctx.save();

      // Subtle shadow (might need adjustment for dark theme)
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'; // Keep shadow dark
      ctx.shadowBlur = isSelected || isHovered ? 8 : 4;
      ctx.shadowOffsetX = 1; // Reduce offset slightly
      ctx.shadowOffsetY = 1;

      // Box Style
      ctx.fillStyle = box.color; // Severity color already adjusted
      ctx.strokeStyle = isSelected ? SELECTED_BORDER_COLOR_DARK : (isHovered ? HOVER_BORDER_COLOR_DARK : DEFAULT_BORDER_COLOR_DARK);
      ctx.lineWidth = isSelected ? 2.5 : (isHovered ? 1.5 : 1);

      // Draw Box
      ctx.beginPath();
      if (ctx.roundRect) {
          ctx.roundRect(box.x, box.y, BOX_WIDTH, BOX_HEIGHT, 8);
      } else {
           ctx.rect(box.x, box.y, BOX_WIDTH, BOX_HEIGHT);
      }
      ctx.fill();
      ctx.stroke();

      ctx.restore(); // Clear shadow for text

      // --- Draw Text Content ---
      ctx.fillStyle = TEXT_COLOR_CANVAS; // Use light text color
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Symptom Name (Truncated)
      ctx.font = "bold 14px 'Segoe UI', sans-serif";
      let displayName = box.name;
      const maxWidth = BOX_WIDTH - 20;
      if (ctx.measureText(displayName).width > maxWidth) {
        while (ctx.measureText(displayName + "...").width > maxWidth && displayName.length > 0) {
          displayName = displayName.slice(0, -1);
        }
        displayName += "...";
      }
      ctx.fillText(displayName, box.x + BOX_WIDTH / 2, box.y + 20);

      // Severity Stars (Use specific colors)
      const severity = box.severity || 1;
      const stars = "★".repeat(severity) + "☆".repeat(5 - severity);
      ctx.font = "16px Arial";
      ctx.fillStyle = getStarColorBySeverity(severity); // Use star color mapping
      ctx.fillText(stars, box.x + BOX_WIDTH / 2, box.y + 45);

      // Location
      ctx.font = "italic 12px 'Segoe UI', sans-serif";
      ctx.fillStyle = 'white'; // Muted light color
      ctx.fillText(box.location || "Unknown", box.x + BOX_WIDTH / 2, box.y + 70);
    });

  }, [symptomBoxes, scale, selectedBoxIndex, hoveredIndex, coordinatesData, getStarColorBySeverity]); // Added deps


  // --- Render ---
  const currentSelectedBox = (selectedBoxIndex !== null && selectedBoxIndex < symptomBoxes.length)
        ? symptomBoxes[selectedBoxIndex]
        : null;

  const InstructionPannel =() => {
    return (
      // --- Instructions Panel ---
      <div className="h-[69vb]">
          <h3 className={`font-semibold text-base mb-2 border-b pb-1 ${PANEL_BORDER}`}>How to Use:</h3>
          <ul className="text-sm list-disc pl-5 space-y-1.5 text-gray-300">
              <li>Click symptom boxes on the left to view details here.</li>
              <li>Click and drag boxes to rearrange them.</li>
              <li>Lines connect symptoms to body locations.</li>
              <li>Colors show severity: <span className="font-bold" style={{color: SEVERITY_COLORS_DARK[0]}}>Yellow</span> to <span className="font-bold" style={{color: SEVERITY_COLORS_DARK[4]}}>Red</span>.</li>
              <li>Boxes avoid spawning in the very center initially.</li>
              <li>Hover over boxes for a highlight.</li>
          </ul>
      </div>
      );
  }


  const ChatBotPatient = () => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const lastMessageRef = useRef(null);

    const handleInputChange = (e) => {
      setInput(e.target.value);
    };

    // Smart scroll function that only scrolls what's needed
    const scrollToNewestMessage = () => {
      if (lastMessageRef.current && chatContainerRef.current) {
        const container = chatContainerRef.current;
        const newMessage = lastMessageRef.current;

        const containerRect = container.getBoundingClientRect();
        const newMessageRect = newMessage.getBoundingClientRect();

        // Check if the new message is fully visible
        const isFullyVisible =
          newMessageRect.top >= containerRect.top &&
          newMessageRect.bottom <= containerRect.bottom;

        // If not fully visible, scroll just enough to show it
        if (!isFullyVisible) {
          // Calculate how much we need to scroll to show the bottom of the message
          // with a small padding
          const scrollNeeded = newMessageRect.bottom - containerRect.bottom + 20;

          if (scrollNeeded > 0) {
            // Only scroll the amount needed to bring message into view
            container.scrollTop += scrollNeeded;
          }
        }
      }
    };

    // Effect to handle scrolling when messages change
    useEffect(() => {
      if (messages.length > 0) {
        scrollToNewestMessage();
      }
    }, [messages]);

    const handleSendMessage = async () => {
      if (input.trim()) {
        const userInput = input;
        const newUserMessage = { text: userInput, sender: 'user' };
        setMessages((prevMessages) => [...prevMessages, newUserMessage]);
        setInput('');
        // Build chat history after including the user message
        const updatedMessages = [...messages, newUserMessage];
        try {
          setIschatbotLoading(true);
          const botReply = await generateBotResponse(userInput, updatedMessages);
          const newBotMessage = { text: botReply, sender: 'bot' };
          setMessages((prevMessages) => [...prevMessages, newBotMessage]);
          setIschatbotLoading(false);
        } catch (error) {
          const errorBotMessage = { text: "Sorry, something went wrong.", sender: 'bot' };
          setMessages((prevMessages) => [...prevMessages, errorBotMessage]);
          console.error("Bot response error:", error);
        }
      }
    };

    // Generate bot response with async API call
    const generateBotResponse = async (userMessage, chatHistory) => {
      try {
        if(symptomsData.length === 0){
          return(<div>
            <p className="text-red-200 text-bold text-center">
              Symptom generation is necessary to enable the conversation feature. To generate symptoms, please press the refresh icon
              <RefreshCw style={{ display: 'inline-block', verticalAlign: 'middle' }} className="w-6 h-6 px-1 text-green-200" />
              and complete the disease form.
            </p>
          </div>)
        }
        if (messages.length >= 30) {
          return(<div>
            <p className="text-red-200 text-bold">
              The conversation quota has been exceeded. Please proceed with a diagnosis based on the information collected thus far.
            </p>
          </div>)
        }
        const response = await API.post("/patientResponse", {
          userResponse: userMessage,
          symptoms: symptomsData,
          ChatHistory: chatHistory,
        });
        if (response.data.message) {
          return response.data.message;
        } else {
          alert("Error:", response.data.message);
        }
      } catch (error) {
        console.log(error);
        throw error;
      }
    };

    // Function to assign the last message ref
    const assignLastMessageRef = (index) => {
      if (index === messages.length - 1) {
        return lastMessageRef;
      }
      return null;
    };

    return (
      <div className="flex flex-col h-[69vb] bg-gray-800 text-white bg-opacity-30 border border-white border-opacity-40 rounded-lg">
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-400 h-full">
              <div className="text-center  p-4">
                Initiate patient interaction by entering your message in the chatbox.<div className="p-1"/><hr className="opacity-30"/> <p className="text-xs pt-2">A maximum of 15 query attempts are permitted.</p>
              </ div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                ref={assignLastMessageRef(index)}
                className={`flex flex-col max-w-3/4 ${
                  message.sender === 'user' ? 'items-end ml-auto' : 'items-start mr-auto'
                }`}
              >
                <span className="text-xs opacity-70 px-2">
                  {message.sender === 'user' ? 'You' : 'Virtual Patient'}
                </span>
                <div
                  className={`p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-300 bg-opacity-30 text-white'
                      : 'bg-gray-700 bg-opacity-70 text-white border border-gray-600'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 flex items-center border-t border-gray-700 border-opacity-50">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => handleKeyDown(e, handleSendMessage)}
            className="flex-1 bg-transparent border border-gray-600 rounded-lg p-2 text-white mr-2 focus:border-red-300 focus:outline-none"
            placeholder="Type your message..."
          />
          {!isChatbotLoading ? (
            <button
              onClick={handleSendMessage}
              className="rounded-full p-2 hover:bg-gray-700 transition duration-300"
              aria-label="Send message"
            >
              <Send className="rotate-45" />
            </button>
          ):(
            <div class="loader w-8 h-8 pl-2"></div>)
          }
        </div>
      </div>
    );
  };

  const InfoPannel = () => {
    if (currentSelectedBox != null) {
      return(
        // --- Info Panel ---
        <div className="m-8">
        <h3 className={`text-lg font-semibold mb-3 pb-2 border-b ${PANEL_BORDER}`}>
            {currentSelectedBox.name}
        </h3>
        <div className="grid grid-cols-1 gap-4 mb-3">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Severity:</label>
                <div className="text-xl flex items-center" style={{ color: getStarColorBySeverity(currentSelectedBox.severity) }}>
                    {"★".repeat(currentSelectedBox.severity) + "☆".repeat(5 - currentSelectedBox.severity)}
                    <span className="text-sm text-gray-400 ml-2">({currentSelectedBox.severity}/5)</span>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Location:</label>
                <div className="text-base text-gray-300">{currentSelectedBox.location}</div>
            </div>
        </div>
        <div className="mt-2">
            <label className="block text-sm font-medium text-gray-400 mb-1">Description:</label>
            <p className={`text-sm text-gray-300 bg-gray-700 p-3 rounded ${PANEL_BORDER} border`}>
                {currentSelectedBox.description || <span className="italic text-gray-500">No description provided.</span>}
            </p>
        </div>
        <button
            onClick={() => setSelectedBoxIndex(null)}
            className={`mt-4 w-full px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
        >
            Close Details
        </button>
    </div>
  );
    } else {
      return(<InstructionPannel />)
    }

  };

  // function for default pannel
  const DefaultPannel = ({ symptomData, setSymptomsData }) => {
    const [disease, setDisease] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [isRandom, setisRandom] = useState('');
    const [patientInfo, setPatientInfo] = useState({
        id: 'PT-2025-4872',
        name: 'John Doe',
        age: 45,
        gender: 'Male',
        height: '5\'10"',
        weight: '170 lbs'
      });
    const [isLoading, setisLoading] = useState(false);

    const handleSubmit = async (Disease) => {
      try {
        setisLoading(true);
        const response = await API.post('/get_symptoms', {
          disease: Disease
        });
        if (response.data.error) {
          alert(`Error: ${response.data.error} \n please retry`);
        } else {
          setSymptomsData(response.data);
          setisLoading(false);
          SetFdisease(Disease);
          setActiveButton('info');
        }
      } catch (error) {
        console.error('Error fetching symptoms:', error);
      }
    };

    const handlerandomcheck = () => {
      if (isRandom === 'Random') {
        const disease_random = giveRandomDisease()
        handleSubmit(disease_random)
        console.log('random', disease_random)
      } else {
        handleSubmit(disease);
        console.log('Begin Simulation')
      }
    }

    const handleEdit = () => {
        setEditMode(!editMode);
      };

    const handleChange = (field, value) => {
        setPatientInfo({...patientInfo, [field]: value});
      };

    useEffect(() => {
        if (disease.length === 0) {
          setisRandom('Random');
        } else {
          setisRandom('Begin Simulation');
        }
      }, [disease]);

    const renderField = (label, field) => {
       return (
         <div className="space-y-1">
           <p className="text-blue-100 text-sm">{label}</p>
           {editMode ? (
             <input
               type={field === 'age' ? 'number' : 'text'}
               value={patientInfo[field]}
               onChange={(e) => handleChange(field, e.target.value)}
               className="w-full p-1 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
             />
           ) : (
             <input
               type={field === 'age' ? 'number' : 'text'}
               value={patientInfo[field]}
               readOnly // Make the input read-only (inactive)
               className="w-full p-1 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none"
               style={{ pointerEvents: 'none' }} // Disable pointer interactions
             />
           )}
         </div>
       );
     };

    return (
      <div className="flex justify-center text-white bg-black bg-opacity-10 backdrop-blur-sm">
        {isLoading ? (
          <div className="h-[69vb] flex items-center justify-center">
            {/* Spinner from Uiverse */}
            <div className="loading inline-flex flex-col items-center justify-center"> {/* Added inline-flex and flex-col */}
            <svg width="64px" height="48px">
              <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="back"></polyline>
              <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="front"></polyline>
            </svg>
            <div>
              <p className="items-center justify center text-white text-sm text-opacity-50 py-4">Please wait while we fetch symptoms ..</p>
            </div>
          </div>
        </div>
        ) : (
          <div className="py-8 w-[100%]">
                {/* Patient ID Card Style Layout */}
                <div className="bg-black bg-opacity-20 border border-gray-700 rounded-xl py-4 px-5 mb-8 relative">
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={handleEdit}
                      className="bg-gray-600 rounded-full p-1 translate-x-2 -translate-y-2 hover:bg-gray-400 transition-colors duration-200"
                    >
                      {editMode ?
                        <Save size={16} className="text-green-300" /> :
                        <Edit size={16} className="text-gray-300" />
                      }
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Left Column - Avatar and ID */}
                    <div className="w-full sm:w-1/3">
                      {/* Virtual Person Symbol */}
                      <div className="bg-gray-800 rounded-lg w-full aspect-square flex items-center justify-center mt-6 mb-4">
                        <User
                            size={90}
                              className={`
                                ${patientInfo.gender?.toLowerCase() === 'male' || patientInfo.gender?.toLowerCase() === 'm' ? 'text-blue-400' : ''}
                                ${patientInfo.gender?.toLowerCase() === 'female' || patientInfo.gender?.toLowerCase() === 'f' ? 'text-rose-400' : ''}
                                ${!(patientInfo.gender?.toLowerCase() === 'male' || patientInfo.gender?.toLowerCase() === 'm' || patientInfo.gender?.toLowerCase() === 'female' || patientInfo.gender?.toLowerCase() === 'f') ? 'text-gray-500' : ''}
                          `}
                        />
                      </div>

                      {/* Patient ID */}
                      <div className="border-t border-gray-700 pt-3 mt-3">
                        <p className="text-gray-400 text-sm">Patient ID</p>
                          <p className="text-white font-mono text-xs">{patientInfo.id}</p>
                      </div>
                    </div>

                    {/* Right Column - Detailed Info */}
                    <div className="w-full sm:w-2/3 bg-gray-400 bg-opacity-30 rounded-lg p-4">
                      <h2 className="text-sm font-semibold py-1 text-white mb-1 border-b border-gray-400">
                        Patient Information {editMode && <span className="text-sm text-blue-300">(Editing)</span>}
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {renderField('Full Name', 'name')}
                        {renderField('Age', 'age')}
                        {renderField('Gender', 'gender')}
                        {renderField('Height', 'height')}
                        {renderField('Weight', 'weight')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Disease Simulation Section */}
                <div className="bg-black bg-opacity-20 border border-gray-700 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Disease Simulator</h2>
                  <div className="relative mb-6">
                    <label className="block text-lg font-medium text-gray-300 mb-2">
                      Enter name of disease to simulate
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Diabetes"
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg text-white bg-black bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-red-300 placeholder-gray-500"
                      value={disease}
                      onChange={(e) => setDisease(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, handlerandomcheck)}

                    />
                  </div>
                  <button
                    onClick={handlerandomcheck}
                    className="w-full px-4 py-3 bg-black border-[1px] border-white border-opacity-10 hover:border-red-800 hover:border-opacity-40 bg-opacity-10 hover:bg-red-400 text-white rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {isRandom === 'Random' ? (
                      <>
                        <Shuffle className="w-4 h-4 inline-block mr-1" /> Random
                      </>
                    ) : isRandom === 'Begin Simulation' ? (
                      <p>Begin Simulation</p>
                            ) : null}
                  </button>
                </div>
              </div>
        )}
      </div>
    );
  };

// issue #26 guide pannel
const Guide = () => {
  const journeySteps = [
    {
      icon: <Search className="w-10 h-10 text-blue-400" />,
      title: "Embark on Your Quest",
      content:
        "Your diagnostic adventure begins here. Enter a known condition, or let fate decide with a random selection to challenge your skills.",
    },
    {
      icon: <Eye className="w-10 h-10 text-purple-400" />,
      title: "Uncover the Clues",
      content:
        "Observe the presenting symptoms. Some are visually mapped to the body. Delve deeper by clicking a symptom to reveal its severity and details.",
    },
    {
      icon: <MessageCircle className="w-10 h-10 text-green-400" />,
      title: "Converse with the Patient",
      content:
        "Engage in dialogue. You have 15 opportunities to ask crucial follow-up questions. Choose them wisely to piece together the medical puzzle.",
    },
    {
      icon: <Sparkles className="w-10 h-10 text-white" />,
      title: "Synthesize Your Findings",
      content:
        "The moment of truth approaches. Weave together all gathered information – symptoms, details, and conversation insights – to form your final diagnosis.",
    },
    {
      icon: <RotateCcw className="w-10 h-10 text-red-400" />,
      title: "Begin Anew",
      content:
        "Ready for another challenge? Hit restart to clear the slate and embark on a fresh diagnostic journey with a new mystery to solve.",
    },
  ];

  // State to track which steps are visible
  const [visibleSteps, setVisibleSteps] = useState({});
  // Refs for each step element to observe
  const stepRefs = useRef([]);

  useEffect(() => {
    // Ensure refs array is populated correctly
    stepRefs.current = stepRefs.current.slice(0, journeySteps.length);

    // Intersection Observer setup
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Mark the step as visible when it enters the viewport
            setVisibleSteps((prev) => ({
              ...prev,
              [entry.target.dataset.index]: true,
            }));
            // Optional: Unobserve after becoming visible if you only want the animation once
            // observer.unobserve(entry.target);
          }
          // Optional: Mark as not visible if it leaves the viewport (if you want fade-out)
          // else {
          //   setVisibleSteps((prev) => ({
          //     ...prev,
          //     [entry.target.dataset.index]: false,
          //   }));
          // }
        });
      },
      {
        root: null, // Use the viewport as the root
        threshold: 0.3, // Trigger when 30% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Adjust margin to trigger slightly earlier/later
      }
    );

    // Observe each step ref that exists
    stepRefs.current.forEach((ref) => {
      if (ref) {
        observer.observe(ref);
      }
    });

    // Cleanup: Disconnect observer when component unmounts
    return () => {
      stepRefs.current.forEach((ref) => {
        if (ref) {
          observer.unobserve(ref);
        }
      });
      observer.disconnect();
    };
  }, [journeySteps.length]); // Rerun effect if number of steps changes

  return (
    // Main container with background gradient and padding
    <div className="flex flex-col items-center w-full py-20 px-4 bg-gradient-to-b from-gray-950 via-gray-800 to-gray-950 text-white min-h-screen overflow-hidden border-[1px] border-gray-700 rounded-md">
      {/* Optional Title for the Guide Section */}
      <h1 className="text-4xl font-bold mb-16 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
        Your Diagnostic Journey
      </h1>

      <div className="text-center m-24">
        <div className="inline-block p-4 rounded-md">
          <h2 className="text-sm mb-2 text-purple-400 font-semibold">
            Start Exploring
          </h2>
          <p className="text-xs text-gray-500">
            Scroll to discover the first step.
          </p>
          <div className="animate-bounce mt-4">
            <ChevronDown className="w-6 h-6 mx-auto text-purple-400" />
          </div>
        </div>
      </div>

      {journeySteps.map((step, index) => {
        const isVisible = !!visibleSteps[index];

        return (
          <div
            key={index}
            // Assign ref and data-index for Intersection Observer
            ref={(el) => (stepRefs.current[index] = el)}
            data-index={index}
            className={`flex flex-col items-center relative transition-all duration-1000 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`} // Fade-in and slide-up animation
          >
            {/* Render the connecting line above the step (except for the first one) */}
            {index > 0 && (
              <div
                aria-hidden="true"
                className={`h-14 w-1 bg-gradient-to-b from-blue-500/60 via-purple-500/60 to-blue-500/60 transition-opacity duration-500 delay-300 ${
                   // Only show line if the *previous* step is visible
                  visibleSteps[index - 1] ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}

            {/* Step Card Content */}
            <div
              className="flex flex-col items-center text-center max-w-lg w-full bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-700/50"
            >
              <div className="mb-5 p-3 bg-gray-700/50 rounded-full shadow-inner">
                 {/* Apply subtle animation to icon when card becomes visible */}
                <div className={`transition-transform duration-500 ease-out ${isVisible ? 'scale-100 rotate-0' : 'scale-90 -rotate-12'}`}>
                   {step.icon}
                </div>
              </div>
              <h2 className="text-2xl font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-400">
                {step.title}
              </h2>
              <p className="text-gray-300 text-base leading-relaxed">
                {step.content}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};


// issue #37 SubmitPannel -- START
const ViewSubmit = () => {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState(null);


  // Function to get access to the context or parent variables safely
  const getParentData = () => {
    try {
      return {
        symptoms: symptomsData || null,
        chatHistory: messages || []
      };
    } catch (e) {
      console.error("Failed to access required data:", e);
      return { symptoms: null, chatHistory: [] };
    }
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) return;

    setError(null);
    setIsSubmitting(true);
    setSubmittedText(inputText);

    const { symptoms, chatHistory } = getParentData();

    // Validate data before sending
    if (!symptoms) {
      setError("Cannot access symptoms data. Please make sure you've selected a disease first.");
      setIsSubmitting(false);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await API.post("/generateReport", {
        userResponse: inputText,
        symptoms: symptoms,
        ChatHistory: chatHistory,
        disease: Fdisease,
      });

      console.log('Submitted successfully:', response);

      if (response.data && response.data.Report) {
        console.log(response.data);
        setReportResult(response.data);
        const datatoView = {};

        if (response.data && response.data.Report && response.data.Report.Result && response.data.Report.categories) {
          const categories = response.data.Report.categories;
          for (const category in categories) {
            if (categories.hasOwnProperty(category) && category === "Medical Competency") {
              const subCategory = categories[category];
              for (const key in subCategory) {
                if (subCategory.hasOwnProperty(key) && typeof subCategory[key] === 'number') {
                  datatoView[key] = subCategory[key]; // Just use the sub-key
                }
              }
            }
          }
        }

        console.log(datatoView);
        setReportData(datatoView);
        setIsSubmitted(true)
        setInputText('');
        setIsSubmitting(false);
      } else if (response.data && response.data.error) {
        setIsSubmitting(false);
        setError(response.data.error || "Received invalid report format");
      } else {
        setIsSubmitting(false);
        setError("Received invalid response from server");
      }
    } catch (error) {
      setIsSubmitting(false);
      console.error('Error submitting response:', error);
      setError(error.message || "Failed to submit. Please try again.");
    }
  };

  return (
    <div className="h-[69vh] p-5 bg-gray-800 rounded-xl overflow-hidden flex flex-col">
      {/* Header with toggle button */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          {isSubmitted && (
            <button
              onClick={() => setIsSubmitted(false)}
              className="mr-3 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition duration-200 flex items-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="ml-1 text-xs">Back</span>
            </button>
          )}
          <h2 className="text-blue-100 font-medium">
            {isSubmitted ? "Report Results" : "Submit Panel"}
          </h2>
        </div>

        {isSubmitting && (
          <div className="flex items-center">
            <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full mr-2"></div>
            <span className="text-blue-200 text-xs">Processing...</span>
          </div>
        )}
      </div>

      {/* Conditional rendering based on isSubmitted state */}
      {!isSubmitted ? (
        /* Input Area */
        <div className="flex-grow flex flex-col">
          <textarea
            className="w-full flex-grow p-3 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition duration-200"
            placeholder="Write your submission here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSubmitting}
            onKeyDown={(e) => handleKeyDown(e, handleSubmit)}
          ></textarea>

          <div className="flex items-center justify-between mt-2">
            <small className="text-gray-400 text-xs">
              {inputText.length > 0 ? `${inputText.length} characters` : "Enter your text"}
            </small>
            <button
              onClick={() => {
                handleSubmit();
                setIsSubmitted(true);
              }}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed transition duration-200 flex items-center"
              disabled={isSubmitting || !inputText.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-900 bg-opacity-20 p-3 rounded-lg text-red-300 text-sm mt-4 border-l-4 border-red-500 flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
        </div>
      ) : (
        /* Results Area */
        <div className="flex-grow overflow-y-auto space-y-4 pr-1">
          {/* Submitted text section */}
          {submittedText && (
            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                <h3 className="text-sm font-medium text-blue-300">Your Submission</h3>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg text-white text-sm whitespace-pre-wrap">
                {submittedText}
              </div>
            </div>
          )}

          {/* Report results section */}
          {reportResult && (
            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gray-800 px-2 py-1 rounded-full text-xs text-gray-300">
                  {new Date().toLocaleDateString()}
                </div>
              </div>

              {/* Results summary section */}
              <div className="mb-5">
                <h4 className="text-blue-300 font-medium mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Analysis Results
                </h4>
                <div className="grid grid-cols-1 gap-3 mt-2">
                  <div className="bg-green-900 bg-opacity-20 p-3 rounded-lg border border-green-800">
                    <p className="text-green-300 font-medium mb-1">Positive</p>
                    <p className="text-sm text-white">{reportResult.Report.Result.Positive}</p>
                  </div>
                  <div className="bg-red-900 bg-opacity-20 p-3 rounded-lg border border-red-800">
                    <p className="text-red-300 font-medium mb-1">Negative</p>
                    <p className="text-sm text-white">{reportResult.Report.Result.Negative}</p>
                  </div>
                </div>
              </div>

              {/* Medical Competency section */}
              <div className="mb-5">
                <h4 className="text-blue-300 font-medium mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Medical Competency
                </h4>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {Object.entries(reportResult.Report.categories["Medical Competency"]).map(([key, value]) => (
                    <div key={key} className="bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-blue-700 transition duration-200">
                      <p className="text-xs text-gray-400 mb-1">{key}</p>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-700 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              value >= 8 ? 'bg-green-500' : value >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${value * 10}%` }}
                          ></div>
                        </div>
                        <span className="text-white font-medium">{value}/10</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visualization section */}
              <div className="mb-5">
                <h4 className="text-blue-300 font-medium mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 000 2h6a1 1 0 100-2H3zm0 4a1 1 0 100 2h8a1 1 0 100-2H3z" clipRule="evenodd" />
                  </svg>
                  Performance Metrics
                </h4>
                <div className="w-full h-64 my-3 bg-gray-800 rounded-lg p-2 border border-gray-700">
                  <BarGraph data={ReportData} />
                </div>
              </div>

              {/* Additional metrics section */}
              <div>
                <h4 className="text-blue-300 font-medium mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Additional Metrics
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-800 py-3 px-1 rounded-lg border border-gray-700 hover:border-blue-700 transition duration-200">
                    <p className="text-xs text-gray-400 mb-1">Communication Style</p>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-700 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            reportResult.Report.categories["Communication style"] >= 8 ? 'bg-green-500' :
                            reportResult.Report.categories["Communication style"] >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${reportResult.Report.categories["Communication style"] * 10}%` }}
                        ></div>
                      </div>
                      <span className="text-white font-medium">{reportResult.Report.categories["Communication style"]}/10</span>
                    </div>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-blue-700 transition duration-200">
                    <p className="text-xs text-gray-400 mb-1">Presentation Quality</p>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-700 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            reportResult.Report.categories["Presentation Quality"] >= 8 ? 'bg-green-500' :
                            reportResult.Report.categories["Presentation Quality"] >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${reportResult.Report.categories["Presentation Quality"] * 10}%` }}
                        ></div>
                      </div>
                      <span className="text-white font-medium">{reportResult.Report.categories["Presentation Quality"]}/10</span>
                    </div>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-blue-700 transition duration-200">
                    <p className="text-xs text-gray-400 mb-3">Diagnosis</p>
                    <p className={`text-lg font-medium ${reportResult.Report.categories["Correctly Diagnosed"] ? "text-green-400" : "text-red-400"}`}>
                      {reportResult.Report.categories["Correctly Diagnosed"] ? "Correct" : "Incorrect"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// issue #37 SubmitPannel -- END

  const ShowPannel = () => {

    const buttons = [
      { id: 'info', icon: <Info className="w-6 h-6" />, title: 'Instructions on how to use the simulator' },
      { id: 'chatbot', icon: <MessageSquare className="w-6 h-6" />, title: "Interact with the simulated patient's digital assistant." },
      { id: 'submit', icon: <Sparkles className="w-6 h-6" />, title: 'Submit the current scenario for review.' },
      { id: 'view', icon: <Eye className="w-6 h-6" />, title: 'View the simulation output or results.' },
      { id: 'retry', icon: <RefreshCw className="w-6 h-6" />, title: 'Retry simulation' },
    ];

    const renderContent = () => {
      switch (activeButton) {
        case 'info':
          return <Guide />
        case 'chatbot':
          return <ChatBotPatient />;
        case 'submit':
          return <ViewSubmit />;
        case 'view':
          return <InfoPannel />;
        case 'retry':
          window.location.reload(true);
          break;
        default:
          return <DefaultPannel symptomData={symptomsData} setSymptomsData={setSymptomsData}/>;
      }
    };

    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-700">
        <div className="flex items-center p-4 text-white font-sans">
          <div className="mr-4">
            <Heart className="text-red-300 w-8 h-8 animate-pulse" fill="none" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Scenario Setup</h1>
          </div>
        </div>

        <div className="flex justify-center p-4 text-white font-sans">
          {buttons.map((button) => (
            <button
              key={button.id}
              className={`mx-2 p-2 rounded-full hover:bg-gray-700 transition duration-150 ${
                activeButton === button.id ? 'text-red-300' : ''
              }`}
              title={button.title}
              onClick={() => setActiveButton(button.id)}
            >
              {button.icon}
            </button>
          ))}
        </div>
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-gray-900 to-transparent"></div>

        <div className="p-4 text-white font-sans">
          {renderContent()}
        </div>
      </div>
    );
  };

  return (
    // Main container with dark theme and flex layout
    <div ref={containerRef} className={`flex flex-col bgforsim md:flex-row md:p-2 gap-6 md:gap-8 ${DARK_THEME_BG} ${DARK_THEME_TEXT} min-h-screen font-sans`}>

      {/* Left Column: Canvas and Image */}
      <div ref={leftColRef} className="flex-shrink-0 w-full md:w-3/5 lg:w-4/6 relative ">
         {/* Inner container to control max width based on original image dimensions */}
         <div className="text-center">
          <h1
              className="text-3xl font-semibold mb-12 bg-white bg-opacity-15 inline-block p-2 backdrop-blur-[0.5px] rounded-lg border-[1px] border-white border-opacity-20"
            >
              Symptom Simulator
            </h1> </div>
            <div className="relative mx-auto" style={{ maxWidth: `${ORIGINAL_WIDTH}px` }}>
              {/* Body Diagram Image - positioned behind canvas */}
              <img
                  src="images/body_diagram.svg" // Make sure this path is correct
                  alt="Body Diagram"
                  className="block w-full h-auto select-none" // Reduced opacity for dark theme
                  style={{
                      width: `${ORIGINAL_WIDTH * scale}px`,
                      height: `${ORIGINAL_HEIGHT * scale}px`,
                  }}
                  draggable="false"
              />
              {/* Canvas Overlay for Symptoms */}
              <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 "
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
              />
          </div>
      </div>

      {/* Right Column: Instructions and Info Panel */}
      <div className={`w-full md:w-2/5 lg:w-3/5 max-h-[92vh] rounded-lg border ${PANEL_BG} ${PANEL_BORDER} flex flex-col`}>
         <div className="flex-grow overflow-y-auto">
          {/* Allow scrolling if content exceeds height */}
          <ShowPannel />
         </div>
      </div>

    </div>
  );
}

export default SymptomVisualizer;
