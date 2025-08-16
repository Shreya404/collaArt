import { useRef, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function Canvas({
  tool,
  canvasRef,
  color,
  eraserSize,
  shapes,
  setShapes,
  selectedShapeId,
  setSelectedShapeId,
  drawingEnabled,
  saveSnapshot,
  textInput,            
  setTextInput  
}) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoints, setCurrentPoints] = useState([]);
  const ctxRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight ;
    ctxRef.current = canvas.getContext("2d");
    redrawAll();
  }, []);

  useEffect(() => {
    redrawAll();
  }, [shapes, color]);

  useEffect(() => {
  const handleResize = () => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redrawAll();
  };
  window.addEventListener('resize', handleResize);
  // Initial sizing for first mount as well
  handleResize();
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, [shapes, color]); // Add anything else that should trigger redraw here

  // Helper for line selection (used in both mouse and touch)
  const isPointNearLine = (px, py, x1, y1, x2, y2, distance = 8) => {
    const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) {
      xx = x1; yy = y1;
    } else if (param > 1) {
      xx = x2; yy = y2;
    } else {
      xx = x1 + param * C; yy = y1 + param * D;
    }
    const dx = px - xx, dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy) < distance;
  };

  // Draw all shapes
  const redrawAll = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    for (const shape of shapes) {
      if (shape.type === "rect") {
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
      } else if (shape.type === "circle") {
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          shape.x,
          shape.y,
          Math.sqrt(shape.w ** 2 + shape.h ** 2),
          0,
          2 * Math.PI
        );
        ctx.stroke();
      } else if (shape.type === "path") {
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.width;
        ctx.beginPath();
        shape.points.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
      } else if (shape.type === "image") {
        const img = new window.Image();
        img.src = shape.src;
        ctx.drawImage(img, shape.x, shape.y, shape.w, shape.h);
      } else if (shape.type === "text") {
        ctx.save();
        ctx.fillStyle = shape.color || "#111";
        ctx.font = `${shape.fontSize || 22}px sans-serif`;
        ctx.textBaseline = "top";
        ctx.fillText(shape.text || "", shape.x, shape.y);
        ctx.restore();
      }
    }
  };

  // Shape selection for mouse
  const handleSelect = e => {
    if (tool !== "select" || !drawingEnabled) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const shape of shapes.slice().reverse()) {
      if (
        (shape.type === "rect" || shape.type === "image") &&
        (() => {
          const x0 = Math.min(shape.x, shape.x + shape.w);
          const x1 = Math.max(shape.x, shape.x + shape.w);
          const y0 = Math.min(shape.y, shape.y + shape.h);
          const y1 = Math.max(shape.y, shape.y + shape.h);
          return x >= x0 && x <= x1 && y >= y0 && y <= y1;
        })()
      ) {
        setSelectedShapeId(shape.id);
        return;
      }
      if (
        shape.type === "circle" &&
        Math.hypot(x - shape.x, y - shape.y) <= Math.sqrt(shape.w ** 2 + shape.h ** 2)
      ) {
        setSelectedShapeId(shape.id);
        return;
      }
      if (shape.type === "path" && shape.points.length > 1) {
        for (let i = 0; i < shape.points.length - 1; i++) {
          const pt1 = shape.points[i], pt2 = shape.points[i + 1];
          if (isPointNearLine(x, y, pt1.x, pt1.y, pt2.x, pt2.y, 8)) {
            setSelectedShapeId(shape.id);
            return;
          }
        }
      }
      if (shape.type === "text") {
        const fontSize = shape.fontSize || 22;
        const margin = 4;
        if (
          x > shape.x - margin &&
          x < shape.x + (shape.text?.length || 1) * fontSize * 0.6 + margin &&
          y > shape.y - margin &&
          y < shape.y + fontSize + margin
        ) {
          setSelectedShapeId(shape.id);
          return;
        }
      }
    }
    setSelectedShapeId(null);
  };

  // ==== Touch selection for "select" tool ====
  const handleSelectTouch = (e) => {
    if (tool !== "select" || !drawingEnabled) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    for (const shape of shapes.slice().reverse()) {
      if (
        (shape.type === "rect" || shape.type === "image") &&
        (() => {
          const x0 = Math.min(shape.x, shape.x + shape.w);
          const x1 = Math.max(shape.x, shape.x + shape.w);
          const y0 = Math.min(shape.y, shape.y + shape.h);
          const y1 = Math.max(shape.y, shape.y + shape.h);
          return x >= x0 && x <= x1 && y >= y0 && y <= y1;
        })()
      ) {
        setSelectedShapeId(shape.id);
        return;
      }
      if (
        shape.type === "circle" &&
        Math.hypot(x - shape.x, y - shape.y) <= Math.sqrt(shape.w ** 2 + shape.h ** 2)
      ) {
        setSelectedShapeId(shape.id);
        return;
      }
      if (shape.type === "path" && shape.points.length > 1) {
        for (let i = 0; i < shape.points.length - 1; i++) {
          const pt1 = shape.points[i], pt2 = shape.points[i + 1];
          if (isPointNearLine(x, y, pt1.x, pt1.y, pt2.x, pt2.y, 8)) {
            setSelectedShapeId(shape.id);
            return;
          }
        }
      }
      if (shape.type === "text") {
        const fontSize = shape.fontSize || 22;
        const margin = 4;
        if (
          x > shape.x - margin &&
          x < shape.x + (shape.text?.length || 1) * fontSize * 0.6 + margin &&
          y > shape.y - margin &&
          y < shape.y + fontSize + margin
        ) {
          setSelectedShapeId(shape.id);
          return;
        }
      }
    }
    setSelectedShapeId(null);
  };

  // Mouse drawing
  const startDrawing = e => {
    if (!drawingEnabled) return;
    const { offsetX: x, offsetY: y } = e.nativeEvent;
    if (tool === "text") {
      setTextInput({ x, y, value: "" });
      setTimeout(() => setTextInput({ x, y, value: "" }), 0);
      return;
    }
    if (tool === "pencil" || tool === "eraser") {
      setIsDrawing(true);
      setCurrentPoints([{ x, y }]);
    } else if (tool === "rect" || tool === "circle") {
      setStartPoint({ x, y });
      setIsDrawing(true);
    }
  };

  const draw = e => {
    if (!isDrawing || !drawingEnabled) return;
    const { offsetX: x, offsetY: y } = e.nativeEvent;
    if (tool === "pencil" || tool === "eraser") {
      setCurrentPoints(pts => [...pts, { x, y }]);
      redrawAll();
      const ctx = ctxRef.current;
      ctx.strokeStyle = tool === "eraser" ? "#fff" : color;
      ctx.lineWidth = tool === "eraser" ? eraserSize : 2;
      ctx.beginPath();
      currentPoints.concat({ x, y }).forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
    } else if (tool === "rect" || tool === "circle") {
      redrawAll();
      const ctx = ctxRef.current;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      if (tool === "rect") {
        ctx.strokeRect(startPoint.x, startPoint.y, x - startPoint.x, y - startPoint.y);
      } else if (tool === "circle") {
        ctx.beginPath();
        ctx.arc(
          startPoint.x,
          startPoint.y,
          Math.sqrt((x - startPoint.x) ** 2 + (y - startPoint.y) ** 2),
          0,
          2 * Math.PI
        );
        ctx.stroke();
      }
    }
  };

  const stopDrawing = e => {
    if (!isDrawing || !drawingEnabled) return;
    setIsDrawing(false);
    const { offsetX: x, offsetY: y } = e.nativeEvent;
    if (tool === "rect" || tool === "circle") {
      const newShape = {
        id: uuidv4(),
        type: tool,
        x: startPoint.x,
        y: startPoint.y,
        w: x - startPoint.x,
        h: y - startPoint.y,
        color
      };
      const newShapes = [...shapes, newShape];
      setShapes(newShapes);
      saveSnapshot(newShapes);
      setStartPoint(null);
    }
    if (tool === "pencil" || tool === "eraser") {
      const newShape = {
        id: uuidv4(),
        type: "path",
        points: currentPoints,
        color: tool === "eraser" ? "#fff" : color,
        width: tool === "eraser" ? eraserSize : 2
      };
      const newShapes = [...shapes, newShape];
      setShapes(newShapes);
      saveSnapshot(newShapes);
      setCurrentPoints([]);
    }
  };

  // ==== TOUCH SUPPORT START ====
  useEffect(() => {
    const canvas = canvasRef.current;

    const getTouchPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    };

    const startTouch = (e) => {
      if (!drawingEnabled) return;
      e.preventDefault();

      if (tool === "select") {
        handleSelectTouch(e);
        return;
      }

      const { x, y } = getTouchPos(e);
      if (tool === "text") {
        setTextInput({ x, y, value: "" });
        setTimeout(() => setTextInput({ x, y, value: "" }), 0);
        return;
      }
      if (tool === "pencil" || tool === "eraser") {
        setIsDrawing(true);
        setCurrentPoints([{ x, y }]);
      } else if (tool === "rect" || tool === "circle") {
        setStartPoint({ x, y });
        setIsDrawing(true);
      }
    };

    const moveTouch = (e) => {
      if (!isDrawing || !drawingEnabled) return;
      e.preventDefault();
      const { x, y } = getTouchPos(e);
      if (tool === "pencil" || tool === "eraser") {
        setCurrentPoints(pts => [...pts, { x, y }]);
        redrawAll();
        const ctx = ctxRef.current;
        ctx.strokeStyle = tool === "eraser" ? "#fff" : color;
        ctx.lineWidth = tool === "eraser" ? eraserSize : 2;
        ctx.beginPath();
        currentPoints.concat({ x, y }).forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
      } else if (tool === "rect" || tool === "circle") {
        redrawAll();
        const ctx = ctxRef.current;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        if (tool === "rect") {
          ctx.strokeRect(startPoint.x, startPoint.y, x - startPoint.x, y - startPoint.y);
        } else if (tool === "circle") {
          ctx.beginPath();
          ctx.arc(
            startPoint.x,
            startPoint.y,
            Math.sqrt((x - startPoint.x) ** 2 + (y - startPoint.y) ** 2),
            0,
            2 * Math.PI
          );
          ctx.stroke();
        }
      }
    };

    const endTouch = (e) => {
      if (!isDrawing || !drawingEnabled) return;
      e.preventDefault();
      let x, y;
      if (e.changedTouches && e.changedTouches[0]) {
        const rect = canvas.getBoundingClientRect();
        x = e.changedTouches.clientX - rect.left;
        y = e.changedTouches.clientY - rect.top;
      } else {
        return;
      }

      setIsDrawing(false);
      if (tool === "rect" || tool === "circle") {
        const newShape = {
          id: uuidv4(),
          type: tool,
          x: startPoint.x,
          y: startPoint.y,
          w: x - startPoint.x,
          h: y - startPoint.y,
          color
        };
        const newShapes = [...shapes, newShape];
        setShapes(newShapes);
        saveSnapshot(newShapes);
        setStartPoint(null);
      }
      if (tool === "pencil" || tool === "eraser") {
        const newShape = {
          id: uuidv4(),
          type: "path",
          points: currentPoints,
          color: tool === "eraser" ? "#fff" : color,
          width: tool === "eraser" ? eraserSize : 2
        };
        const newShapes = [...shapes, newShape];
        setShapes(newShapes);
        saveSnapshot(newShapes);
        setCurrentPoints([]);
      }
    };

    canvas.addEventListener('touchstart', startTouch, { passive: false });
    canvas.addEventListener('touchmove', moveTouch, { passive: false });
    canvas.addEventListener('touchend', endTouch);

    return () => {
      canvas.removeEventListener('touchstart', startTouch);
      canvas.removeEventListener('touchmove', moveTouch);
      canvas.removeEventListener('touchend', endTouch);
    };
  }, [tool, drawingEnabled, currentPoints, isDrawing, startPoint, color, eraserSize, shapes]);
  // ==== TOUCH SUPPORT END ====

  return (
    <canvas
      ref={canvasRef}
      className="border border-gray-400 bg-white h-screen w-screen"
      onMouseDown={tool === "select" ? handleSelect : startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      style={{ position: "absolute", left: 0, top: 0, zIndex: 1 }}
    />
  );
}
