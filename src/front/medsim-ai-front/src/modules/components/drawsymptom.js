import React, { useRef, useState, useEffect, useCallback } from "react";
import "../../styles/blob.css";
import API from "./api";
import { Heart, Info, MessageSquare, Send, Eye, RefreshCw, Edit, Save, User } from 'lucide-react';
import { handleKeyDown } from "./handle_enter";

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
          const botReply = await generateBotResponse(userInput, updatedMessages);
          const newBotMessage = { text: botReply, sender: 'bot' };
          setMessages((prevMessages) => [...prevMessages, newBotMessage]);
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
              <p className="text-center  p-4">
                Initiate patient interaction by entering your message in the chatbox.<div className="p-1"/><hr className="opacity-30"/> <p className="text-xs pt-2">A maximum of 15 query attempts are permitted.</p>
              </p>
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
          <button
            onClick={handleSendMessage}
            className="rounded-full p-2 hover:bg-gray-700 transition duration-300"
            aria-label="Send message"
          >
            <Send className="rotate-45" />
          </button>
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
    const [patientInfo, setPatientInfo] = useState({
        id: 'PT-2025-4872',
        name: 'John Doe',
        age: 45,
        gender: 'Male',
        height: '5\'10"',
        weight: '170 lbs'
      });
    const [isLoading, setisLoading] = useState(false);

    const handleSubmit = async () => {
      try {
        setisLoading(true);
        const response = await API.post('/get_symptoms', {
          disease: disease
        });
        if (response.data.error) {
          alert(`Error: ${response.data.error} \n please retry`);
        } else {
          setSymptomsData(response.data);
          setisLoading(false);
          setActiveButton('info');
        }
      } catch (error) {
        console.error('Error fetching symptoms:', error);
      }
    };

    const handleEdit = () => {
        setEditMode(!editMode);
      };

    const handleChange = (field, value) => {
        setPatientInfo({...patientInfo, [field]: value});
      };

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
                      onKeyDown={(e) => handleKeyDown(e, handleSubmit)}

                    />
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="w-full px-4 py-3 bg-black border-[1px] border-white border-opacity-10 hover:border-red-800 hover:border-opacity-40 bg-opacity-10 hover:bg-red-400 text-white rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Begin Simulation
                  </button>
                </div>
              </div>
        )}
      </div>
    );
  };

// issue #26 guide pannel
const Guide = () => {
  return (
    <div>
      <div className="h-[69vb] overflow-y-auto pr-2">
        <h3 className={`font-semibold text-base mb-2 border-b pb-3 text-xl ${PANEL_BORDER}`}>How to Use:</h3>
        <ul className="text-md list-none pl-1 space-y-3 text-gray-300 pb-3">

          {/* Disease Input */}
          <li>
            <details className="group">
              <summary className="cursor-pointer font-medium hover:text-white">🧪 Disease Input</summary>
              <ul className="list-disc pl-5 mt-1 space-y-1.5">
                <li>Enter the name of a disease in the input field to view its related symptoms.</li>
                <li>Click the <Eye className="inline w-4 h-4 mr-1" /> <strong>Eye button</strong> to get more details about each symptom, including severity and description.</li>
              </ul>
            </details>
          </li>

          {/* Random Simulation */}
          <li>
            <details className="group">
              <summary className="cursor-pointer font-medium hover:text-white">🎲 Random Simulation</summary>
              <ul className="list-disc pl-5 mt-1 space-y-1.5">
                <li>Click the <RefreshCw className="inline w-4 h-4 mr-1" /> <strong>Random button</strong> to generate a set of symptoms.</li>
                <li>The system will predict the most likely disease based on the generated symptoms.</li>
              </ul>
            </details>
          </li>

          {/* Buttons Guide */}
          <li>
            <details className="group">
              <summary className="cursor-pointer font-medium hover:text-white">🧭 Button Functions</summary>
              <ul className="list-disc pl-5 mt-1 space-y-1.5">
                <li><Info className="inline w-4 h-4 mr-1" /> <strong>Button:</strong> View the full instruction guide.</li>
                <li><MessageSquare className="inline w-4 h-4 mr-1" /> <strong>Button:</strong> Start a simulated conversation with the patient via chatbox.</li>
                <li><Send className="inline w-4 h-4 mr-1" /> <strong>Button:</strong> Finalize your findings and observations.</li>
                <li><RefreshCw className="inline w-4 h-4 mr-1" /> <strong>Button:</strong> Rerun the simulation with the same or a different disease.</li>
              </ul>
            </details>
          </li>

          {/* Tips & Best Practices */}
          <li>
            <details className="group">
              <summary className="cursor-pointer font-medium hover:text-white">💡 Tips & Best Practices</summary>
              <ul className="list-disc pl-5 mt-1 space-y-1.5">
                <li>Ensure correct spelling of disease names for accurate data.</li>
                <li>Use the chat for role-playing scenarios in training or learning environments.</li>
                <li>Submit only after reviewing all data and concluding your diagnosis.</li>
              </ul>
            </details>
          </li>

        </ul>
      </div>
    </div>
  );
};


// issue #37 SubmitPannel
const ViewSubmit = () => {
  return (<div>
    <p>Submit Pannel</p>
  </div>);
}

  const ShowPannel = () => {

    const buttons = [
      { id: 'info', icon: <Info className="w-6 h-6" />, title: 'Instructions on how to use the simulator' },
      { id: 'chatbot', icon: <MessageSquare className="w-6 h-6" />, title: "Interact with the simulated patient's digital assistant." },
      { id: 'submit', icon: <Send className="w-6 h-6" />, title: 'Submit the current scenario for review.' },
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
