import React, { useState, useEffect, useRef } from 'react';
import { ChartBar, X } from 'lucide-react';

// Helper function to adjust color brightness (unchanged)
function adjustColor(color, amount) {
  return '#' + color.replace(/^#/, '').replace(/../g, (hex) =>
    ('0' + Math.min(255, Math.max(0, parseInt(hex, 16) + amount)).toString(16)).slice(-2)
  );
}

export default function BarGraph({
  data = {
    "Sales": 420,
    "Marketing": 380,
    "Development": 650,
    "HR": 230,
    "Finance": 310,
    "Operations": 480
  },
  // Dark Theme Defaults
  bgColor = "#1f2937", // gray-800
  axisColor = "#6b7280", // gray-500
  gridColor = "#374151", // gray-700
  textColor = "#d1d5db", // gray-300
  colors = [          // Darker, distinct colors
    '#1e40af', // blue-800
    '#065f46', // emerald-800
    '#9a3412', // orange-800
    '#991b1b', // red-800
    '#7e22ce', // purple-700
    '#164e63', // cyan-800
    '#86198f'  // fuchsia-800
  ]
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 }); // Start with 0
  const [hoverIndex, setHoverIndex] = useState(-1);
  const [showLegend, setShowLegend] = useState(false);

  // Update canvas dimensions when container changes
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) {
        return;
      }
      const { width, height } = entries[0].contentRect;
      // Only update if dimensions actually changed to avoid redundant redraws
      setDimensions(prev => {
        if (prev.width !== Math.round(width) || prev.height !== Math.round(height)) {
          return { width: Math.round(width), height: Math.round(height) };
        }
        return prev;
      });
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      // Initial size capture
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width: Math.round(width), height: Math.round(height) });
    }

    return () => {
      if (containerRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // Draw chart whenever dimensions, data, or other relevant state changes
  useEffect(() => {
    // Don't draw if dimensions are not set yet or canvas is not ready
    if (!canvasRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const canvas = canvasRef.current;
    // Use device pixel ratio for sharper rendering on high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr); // Scale context to match DPR

    const keys = Object.keys(data);
    const values = Object.values(data);
    const maxValue = values.length > 0 ? Math.max(...values) * 1.1 : 100; // Add 10% headroom, handle empty data

    // --- Layout Calculation ---
    const legendWidth = 200; // Fixed width for the legend box
    const margin = { // Adjusted margins
      top: 20,
      right: 20, // Fixed right margin - graph area doesn't change with legend
      bottom: 40,
      left: 50
    };
    // Graph dimensions are calculated based on FIXED margins
    const graphWidth = dimensions.width - margin.left - margin.right;
    const graphHeight = dimensions.height - margin.top - margin.bottom;

    // Ensure graph dimensions are positive
    if (graphWidth <= 0 || graphHeight <= 0) return; // Cannot draw if space is too small

    // --- Drawing ---

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Add subtle gradient background to graph area
    const gradient = ctx.createLinearGradient(
      margin.left, margin.top, margin.left, margin.top + graphHeight
    );
    // Use transparent versions of bgColor for subtle effect
    gradient.addColorStop(0, adjustColor(bgColor, 10) + '00'); // More transparent at top
    gradient.addColorStop(1, adjustColor(bgColor, 10) + '33'); // Slightly less transparent at bottom
    ctx.fillStyle = gradient;
    ctx.fillRect(margin.left, margin.top, graphWidth, graphHeight);

    // Draw Y axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + graphHeight);
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.5; // Slightly thicker axis
    ctx.stroke();

    // Draw X axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + graphHeight);
    ctx.lineTo(margin.left + graphWidth, margin.top + graphHeight);
    ctx.stroke();

    // Draw Y-axis grid lines and labels
    const yTickCount = 5; // This gives 6 ticks including 0
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = '11px sans-serif';
    ctx.fillStyle = textColor;

    // Calculate a nice, round number for the max tick value
    // This ensures our tick labels will be clean values
    const actualMaxValue = values.length > 0 ? Math.max(...values) : 100;
    const niceMax = Math.ceil(actualMaxValue / 10) * 10; // Round up to nearest 10

    // Calculate interval between ticks - use the nice max value
    const interval = niceMax / yTickCount;

    for (let i = 0; i <= yTickCount; i++) {
      // Use the exact interval for perfectly even spacing
      const value = i * interval;

      // Calculate y position using maxValue for proper scaling
      const y = margin.top + graphHeight - (value / maxValue) * graphHeight;

      // Grid line
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + graphWidth, y);
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Label - show as integer if whole number
      const label = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
      ctx.fillText(label, margin.left - 8, y);
    }

    // Y-axis title
    ctx.save();
    ctx.translate(margin.left - 35, margin.top + graphHeight / 2); // Adjusted position
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = textColor;
    ctx.fillText('Values', 0, 0);
    ctx.restore();

    // Bar width and spacing
    const numBars = keys.length;
    const totalBarSpacing = graphWidth / numBars;
    const barWidth = Math.min(60, totalBarSpacing * 0.6); // Max width 60, 60% of available space

    // Draw bars
    keys.forEach((key, i) => {
      const value = data[key] || 0; // Handle potential undefined/null values
      const barHeight = (value / maxValue) * graphHeight;
      // Ensure barHeight is not negative if value is 0 or negative
      const effectiveBarHeight = Math.max(0, barHeight);

      const x = margin.left + i * totalBarSpacing + (totalBarSpacing - barWidth) / 2;
      const y = margin.top + graphHeight - effectiveBarHeight;

      // Create gradient for bar
      const baseColor = colors[i % colors.length];
      const barGradient = ctx.createLinearGradient(x, y, x, margin.top + graphHeight);
      barGradient.addColorStop(0, baseColor);
      barGradient.addColorStop(1, adjustColor(baseColor, -40)); // Darker shade at bottom

      // Determine fill style based on hover
      const fillStyle = i === hoverIndex ? barGradient : adjustColor(baseColor, 30); // Lighter on hover

      // Bar with rounded top
      const cornerRadius = 4;
      ctx.beginPath();
      // Start from bottom left, move up, curve top-left, line across top, curve top-right, move down
      ctx.moveTo(x, margin.top + graphHeight);
      ctx.lineTo(x, y + cornerRadius);
      ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
      ctx.lineTo(x + barWidth - cornerRadius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + cornerRadius);
      ctx.lineTo(x + barWidth, margin.top + graphHeight);
      ctx.closePath(); // Close path back to bottom right (implicitly)

      // Fill bar
      ctx.fillStyle = fillStyle;
      ctx.fill();

      // Bar border (optional, subtle)
      // ctx.strokeStyle = adjustColor(baseColor, -60);
      // ctx.lineWidth = 0.5;
      // ctx.stroke();

      // Value label above bar
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px sans-serif';
      // Position label slightly above the bar top (y coordinate)
      if (effectiveBarHeight > 15) { // Only show label if bar is tall enough
         ctx.fillText(value.toString(), x + barWidth / 2, y - 6);
      }
    });


    // --- Draw Legend Overlay if visible ---
    if (showLegend) {
      const legendPadding = 10;
      const legendItemHeight = 22; // Height per legend item
      const legendBoxSize = 12;
      const legendItemSpacing = 5; // Vertical space between items
      const totalLegendHeight = keys.length * legendItemHeight + (keys.length -1) * legendItemSpacing + 2 * legendPadding;
      const legendX = dimensions.width - legendWidth - 15; // Position from right edge
      const legendY = 35; // Position from top edge (below button)

      // Legend background with rounded corners
      ctx.fillStyle = adjustColor(bgColor, 15) + 'E6'; // Slightly lighter semi-transparent background
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const legendRadius = 5;
      ctx.moveTo(legendX + legendRadius, legendY);
      ctx.lineTo(legendX + legendWidth - legendRadius, legendY);
      ctx.quadraticCurveTo(legendX + legendWidth, legendY, legendX + legendWidth, legendY + legendRadius);
      ctx.lineTo(legendX + legendWidth, legendY + totalLegendHeight - legendRadius);
      ctx.quadraticCurveTo(legendX + legendWidth, legendY + totalLegendHeight, legendX + legendWidth - legendRadius, legendY + totalLegendHeight);
      ctx.lineTo(legendX + legendRadius, legendY + totalLegendHeight);
      ctx.quadraticCurveTo(legendX, legendY + totalLegendHeight, legendX, legendY + totalLegendHeight - legendRadius);
      ctx.lineTo(legendX, legendY + legendRadius);
      ctx.quadraticCurveTo(legendX, legendY, legendX + legendRadius, legendY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();


      // Legend items
      ctx.font = '12px sans-serif';
      ctx.textBaseline = 'middle';

      keys.forEach((key, i) => {
        const itemY = legendY + legendPadding + i * (legendItemHeight + legendItemSpacing);
        const baseColor = colors[i % colors.length];

        // Color box
        const boxX = legendX + legendPadding;
        const boxY = itemY + (legendItemHeight - legendBoxSize) / 2; // Center box vertically in item height

        // Box gradient
        const boxGradient = ctx.createLinearGradient(boxX, boxY, boxX, boxY + legendBoxSize);
        boxGradient.addColorStop(0, baseColor);
        boxGradient.addColorStop(1, adjustColor(baseColor, -30));

        // Draw rounded box
        const boxRadius = 3;
        ctx.beginPath();
        ctx.moveTo(boxX + boxRadius, boxY);
        ctx.lineTo(boxX + legendBoxSize - boxRadius, boxY);
        ctx.quadraticCurveTo(boxX + legendBoxSize, boxY, boxX + legendBoxSize, boxY + boxRadius);
        ctx.lineTo(boxX + legendBoxSize, boxY + legendBoxSize - boxRadius);
        ctx.quadraticCurveTo(boxX + legendBoxSize, boxY + legendBoxSize, boxX + legendBoxSize - boxRadius, boxY + legendBoxSize);
        ctx.lineTo(boxX + boxRadius, boxY + legendBoxSize);
        ctx.quadraticCurveTo(boxX, boxY + legendBoxSize, boxX, boxY + legendBoxSize - boxRadius);
        ctx.lineTo(boxX, boxY + boxRadius);
        ctx.quadraticCurveTo(boxX, boxY, boxX + boxRadius, boxY);
        ctx.closePath();

        // Fill and stroke
        ctx.fillStyle = i === hoverIndex ? boxGradient : adjustColor(baseColor, 30);
        ctx.fill();
        ctx.strokeStyle = adjustColor(baseColor, -60);
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Label Text
        ctx.fillStyle = textColor;
        ctx.textAlign = 'left';
        ctx.fillText(key, boxX + legendBoxSize + 8, itemY + legendItemHeight / 2);

        // Value (optional, can remove if not needed in legend)
        // ctx.textAlign = 'right';
        // ctx.fillText(data[key].toString(), legendX + legendWidth - legendPadding, itemY + legendItemHeight / 2);
      });
    }

    // --- Hover Detection ---
    // Need to reattach listeners if dependencies change,
    // but simpler to just define them within the effect.
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      // Calculate mouse position relative to the scaled canvas
      const mouseX = (e.clientX - rect.left);
      const mouseY = (e.clientY - rect.top);

      let currentHoverIndex = -1;
      let isHovering = false;

      // Check bar hover
      keys.forEach((key, i) => {
        const value = data[key] || 0;
        const barHeight = Math.max(0, (value / maxValue) * graphHeight);
        const x = margin.left + i * totalBarSpacing + (totalBarSpacing - barWidth) / 2;
        const y = margin.top + graphHeight - barHeight;

        if (
          mouseX >= x &&
          mouseX <= x + barWidth &&
          mouseY >= y && // Hover starts from the top of the bar
          mouseY <= margin.top + graphHeight // Ends at the bottom (X-axis)
        ) {
          currentHoverIndex = i;
          isHovering = true;
        }
      });

       // Check legend item hover if legend is visible
       if (showLegend) {
            const legendItemHeight = 22;
            const legendItemSpacing = 5;
            const legendPadding = 10;
            const legendX = dimensions.width - legendWidth - 15;
            const legendY = 35;

            keys.forEach((key, i) => {
                const itemY = legendY + legendPadding + i * (legendItemHeight + legendItemSpacing);
                // Check hover over the entire legend item area for easier interaction
                if (
                    mouseX >= legendX &&
                    mouseX <= legendX + legendWidth &&
                    mouseY >= itemY &&
                    mouseY <= itemY + legendItemHeight
                ) {
                    currentHoverIndex = i;
                    isHovering = true;
                }
            });
      }


      canvas.style.cursor = isHovering ? 'pointer' : 'default';

      // Only update state if hover index actually changes
      if (currentHoverIndex !== hoverIndex) {
        setHoverIndex(currentHoverIndex);
      }
    };

    const handleMouseLeave = () => {
      // Check if hoverIndex is already -1 before setting state
      if (hoverIndex !== -1) {
          setHoverIndex(-1);
      }
      canvas.style.cursor = 'default';
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup function to remove listeners
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };

  }, [data, dimensions, colors, bgColor, axisColor, gridColor, textColor, hoverIndex, showLegend]); // Dependencies for redraw

  return (
    <div
        className="w-full h-full relative rounded-lg overflow-hidden" // Ensure overflow is hidden if canvas is slightly off
        ref={containerRef}
        style={{ backgroundColor: bgColor }} // Apply bgColor to container for consistency
    >
      <canvas
        ref={canvasRef}
        // Style is set dynamically in useEffect for DPR scaling
      />

      {/* Legend Toggle Button */}
      <button // Use button element for accessibility
        title={showLegend ? "Hide Legend" : "Show Legend"}
        className={`absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 ${
          showLegend
            ? 'bg-gray-600 hover:bg-gray-500' // Darker background when active
            : 'bg-gray-700 hover:bg-gray-600' // Standard dark background
        }`}
        onClick={() => setShowLegend(!showLegend)}
        aria-pressed={showLegend} // Accessibility attribute
      >
        {showLegend ? (
          <X size={18} className="text-gray-200" /> // Light icon on dark bg
        ) : (
          <ChartBar size={18} className="text-gray-200" /> // Light icon on dark bg
        )}
      </button>
    </div>
  );
}
