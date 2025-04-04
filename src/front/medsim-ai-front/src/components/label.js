import React, { useRef, useState, useEffect } from "react";

function LabelEditor() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [labels, setLabels] = useState([]);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [draggingPointType, setDraggingPointType] = useState(null); // 'label' or 'target'
  const [newLabel, setNewLabel] = useState("");
  const [scale, setScale] = useState(1);
  const [placementMode, setPlacementMode] = useState("idle"); // 'idle', 'placingLabel', 'placingTarget'
  const [selectedLabelIndex, setSelectedLabelIndex] = useState(null);
  
  // Original dimensions - we'll use these as a reference point
  const originalWidth = 900;
  const originalHeight = 550;
  
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;
      
      // Calculate the scale based on container width
      const containerWidth = container.clientWidth;
      const newScale = Math.min(1, containerWidth / originalWidth);
      setScale(newScale);
    };

    // Set initial scale
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Convert actual coordinates to relative coordinates (0-1 range)
  const toRelativeCoords = (x, y) => {
    return {
      relX: x / (originalWidth * scale),
      relY: y / (originalHeight * scale)
    };
  };

  // Convert relative coordinates to actual screen coordinates
  const toScreenCoords = (relX, relY) => {
    return {
      x: relX * (originalWidth * scale),
      y: relY * (originalHeight * scale)
    };
  };

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { relX, relY } = toRelativeCoords(x, y);
    
    if (placementMode === "idle") {
      // Check if we're clicking on an existing label or target point
      const hitIndex = findHitElement(x, y);
      if (hitIndex !== -1) {
        setSelectedLabelIndex(hitIndex);
        return;
      }
      
      // If we have a new label name and we're not in placement mode, start placing a label
      if (newLabel) {
        setPlacementMode("placingLabel");
        const newLabelObj = { 
          name: newLabel, 
          labelRelX: relX, 
          labelRelY: relY,
          targetRelX: null,
          targetRelY: null
        };
        setLabels([...labels, newLabelObj]);
        setSelectedLabelIndex(labels.length);
        setPlacementMode("placingTarget");
      }
    } else if (placementMode === "placingTarget") {
      // Place the target point
      const updatedLabels = [...labels];
      if (selectedLabelIndex !== null && selectedLabelIndex < updatedLabels.length) {
        updatedLabels[selectedLabelIndex] = {
          ...updatedLabels[selectedLabelIndex],
          targetRelX: relX,
          targetRelY: relY
        };
        setLabels(updatedLabels);
        setPlacementMode("idle");
        setNewLabel("");
      }
    }
  };

  const findHitElement = (x, y) => {
    // Check if we hit a label or target point
    return labels.findIndex(label => {
      const { x: labelX, y: labelY } = toScreenCoords(label.labelRelX, label.labelRelY);
      
      // Check if we hit the label box
      if (Math.abs(labelX - x) < 40 && Math.abs(labelY - y) < 20) {
        setDraggingPointType("label");
        return true;
      }
      
      // Check if we hit the target point (if it exists)
      if (label.targetRelX !== null && label.targetRelY !== null) {
        const { x: targetX, y: targetY } = toScreenCoords(label.targetRelX, label.targetRelY);
        if (Math.abs(targetX - x) < 10 && Math.abs(targetY - y) < 10) {
          setDraggingPointType("target");
          return true;
        }
      }
      
      return false;
    });
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hitIndex = findHitElement(x, y);
    if (hitIndex !== -1) {
      setDraggingIndex(hitIndex);
      setSelectedLabelIndex(hitIndex);
    }
  };

  const handleMouseMove = (e) => {
    if (draggingIndex === null) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update with relative coordinates
    const { relX, relY } = toRelativeCoords(x, y);
    const updatedLabels = [...labels];
    
    if (draggingPointType === "label") {
      updatedLabels[draggingIndex] = { 
        ...updatedLabels[draggingIndex], 
        labelRelX: relX, 
        labelRelY: relY 
      };
    } else if (draggingPointType === "target") {
      updatedLabels[draggingIndex] = { 
        ...updatedLabels[draggingIndex], 
        targetRelX: relX, 
        targetRelY: relY 
      };
    }
    
    setLabels(updatedLabels);
  };

  const handleMouseUp = () => {
    setDraggingIndex(null);
    setDraggingPointType(null);
  };

  // Update specific coordinate values
  const updateCoordinate = (index, field, value) => {
    const updatedLabels = [...labels];
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue)) {
      // Convert absolute coordinates to relative if needed
      if (field === "labelX") {
        updatedLabels[index].labelRelX = numValue / originalWidth;
      } else if (field === "labelY") {
        updatedLabels[index].labelRelY = numValue / originalHeight;
      } else if (field === "targetX") {
        updatedLabels[index].targetRelX = numValue / originalWidth;
      } else if (field === "targetY") {
        updatedLabels[index].targetRelY = numValue / originalHeight;
      } else if (field === "name") {
        updatedLabels[index].name = value;
      }
      
      setLabels(updatedLabels);
    }
  };

  // Get coordinates for JSON export
  const getExportData = () => {
    return labels.map(label => ({
      name: label.name,
      label: {
        relX: label.labelRelX,
        relY: label.labelRelY,
        x: Math.round(label.labelRelX * originalWidth),
        y: Math.round(label.labelRelY * originalHeight)
      },
      target: label.targetRelX !== null ? {
        relX: label.targetRelX,
        relY: label.targetRelY,
        x: Math.round(label.targetRelX * originalWidth),
        y: Math.round(label.targetRelY * originalHeight)
      } : null
    }));
  };

  const drawLabels = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas dimensions to match the scaled image
    canvas.width = originalWidth * scale;
    canvas.height = originalHeight * scale;
    
    // Draw the canvas background (transparent)
    ctx.fillStyle = "rgba(220, 220, 220, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw labels
    labels.forEach((label, index) => {
      const { x: labelX, y: labelY } = toScreenCoords(label.labelRelX, label.labelRelY);
      const isSelected = index === selectedLabelIndex;
      
      // Draw connection line if target exists
      if (label.targetRelX !== null && label.targetRelY !== null) {
        const { x: targetX, y: targetY } = toScreenCoords(label.targetRelX, label.targetRelY);
        
        // Draw the line
        ctx.beginPath();
        ctx.moveTo(labelX, labelY);
        ctx.lineTo(targetX, targetY);
        ctx.strokeStyle = isSelected ? "#FF6B00" : "#000000";
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();
        
        // Draw the target point
        ctx.beginPath();
        ctx.arc(targetX, targetY, 5, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? "#FF6B00" : "#000000";
        ctx.fill();
      }
      
      // Draw label background
      ctx.fillStyle = isSelected ? "rgba(255, 107, 0, 0.8)" : "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(labelX - 40, labelY - 15, 80, 30);
      
      // Draw label text
      ctx.font = `${14 * scale}px Arial`;
      ctx.textAlign = "center";
      ctx.fillStyle = "white";
      ctx.fillText(label.name, labelX, labelY + 5);
    });
    
    // Draw placement helper text
    if (placementMode === "placingTarget") {
      ctx.font = "16px Arial";
      ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
      ctx.fillText("Click to place target point", canvas.width / 2, 30);
    }
  };

  useEffect(() => {
    drawLabels();
  }, [labels, scale, selectedLabelIndex, placementMode]);

  return (
    <div ref={containerRef} className="flex flex-col items-center p-4 w-full max-w-6xl mx-auto">
      <div className="w-full mb-4">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Enter organ name"
          className="w-full mb-2 p-2 border rounded"
          disabled={placementMode !== "idle"}
        />
        <p className="text-sm text-gray-600">
          {placementMode === "idle" 
            ? "Type a label name, then click on diagram to place label, then click again to set target point." 
            : placementMode === "placingLabel" 
              ? "Click to place the label" 
              : "Click to place the target point"}
        </p>
      </div>
      
      <div className="relative w-full" style={{ maxWidth: `${originalWidth}px` }}>
        {/* SVG Image */}
        <img
          src="images/body_diagram.svg"
          alt="Body Diagram"
          className="w-full h-auto"
          style={{ width: `${originalWidth * scale}px`, height: `${originalHeight * scale}px` }}
        />
        
        {/* Canvas overlay for interaction */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 cursor-pointer"
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      
      {/* Coordinates editor */}
      {selectedLabelIndex !== null && selectedLabelIndex < labels.length && (
        <div className="mt-4 w-full max-w-md border p-4 rounded bg-gray-50">
          <h3 className="font-bold mb-2">Edit Coordinates</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm">Label Name</label>
              <input
                type="text"
                value={labels[selectedLabelIndex].name}
                onChange={(e) => updateCoordinate(selectedLabelIndex, "name", e.target.value)}
                className="w-full p-1 border rounded"
              />
            </div>
            <div></div>
            <div>
              <label className="block text-sm">Label X</label>
              <input
                type="number"
                value={Math.round(labels[selectedLabelIndex].labelRelX * originalWidth)}
                onChange={(e) => updateCoordinate(selectedLabelIndex, "labelX", e.target.value)}
                className="w-full p-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm">Label Y</label>
              <input
                type="number"
                value={Math.round(labels[selectedLabelIndex].labelRelY * originalHeight)}
                onChange={(e) => updateCoordinate(selectedLabelIndex, "labelY", e.target.value)}
                className="w-full p-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm">Target X</label>
              <input
                type="number"
                value={labels[selectedLabelIndex].targetRelX !== null ? 
                  Math.round(labels[selectedLabelIndex].targetRelX * originalWidth) : ""}
                onChange={(e) => updateCoordinate(selectedLabelIndex, "targetX", e.target.value)}
                className="w-full p-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm">Target Y</label>
              <input
                type="number"
                value={labels[selectedLabelIndex].targetRelY !== null ? 
                  Math.round(labels[selectedLabelIndex].targetRelY * originalHeight) : ""}
                onChange={(e) => updateCoordinate(selectedLabelIndex, "targetY", e.target.value)}
                className="w-full p-1 border rounded"
              />
            </div>
          </div>
          <button
            onClick={() => {
              const updatedLabels = [...labels];
              updatedLabels.splice(selectedLabelIndex, 1);
              setLabels(updatedLabels);
              setSelectedLabelIndex(null);
            }}
            className="mt-2 p-1 bg-red-500 text-white rounded text-sm"
          >
            Delete This Label
          </button>
        </div>
      )}
      
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {
            const jsonData = JSON.stringify(getExportData(), null, 2);
            console.log(jsonData);
            
            // Create download option
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'label-coordinates.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Export JSON
        </button>
        <button
          onClick={() => {
            setLabels([]);
            setSelectedLabelIndex(null);
            setPlacementMode("idle");
          }}
          className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear All Labels
        </button>
        <button
          onClick={() => {
            if (selectedLabelIndex !== null) {
              setSelectedLabelIndex(null);
            }
            setPlacementMode("idle");
          }}
          className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Cancel Selection
        </button>
      </div>
    </div>
  );
}

export default LabelEditor;