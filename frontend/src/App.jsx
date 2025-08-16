import { useState, useRef, useEffect } from "react";
import Toolbar from "./Toolbar";
import Canvas from "./Canvas";
import { Rnd } from "react-rnd";
import { v4 as uuidv4 } from "uuid";
import { io } from "socket.io-client";
const socket = io("http://localhost:3001");

export default function App() {
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#000000");
  const [eraserSize, setEraserSize] = useState(10);
  const [shapes, setShapes] = useState([]);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [imageOverlay, setImageOverlay] = useState(null);
  const [textInput, setTextInput] = useState(null);

  const canvasRef = useRef(null);
  const historyRef = useRef([JSON.stringify([])]);
  const redoRef = useRef([]);

  // Helper for local update and broadcast
  const broadcastShapes = (newShapes, shouldSnapshot = true) => {
    setShapes(newShapes);
    socket.emit("shapes:update", newShapes);
    if (shouldSnapshot) saveSnapshot(newShapes);
  };
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Socket connected! Client ID:", socket.id);
    });
    return () => socket.off("connect");
  }, []);

  // Only run ONCE on mount (do not reset history every render)
  useEffect(() => {
    historyRef.current = [JSON.stringify(shapes)];
  }, []);

  useEffect(() => {
    socket.on("shapes:init", (remoteShapes) => {
      setShapes(remoteShapes);
      historyRef.current = [JSON.stringify(remoteShapes)];
      redoRef.current = [];
    });

    socket.on("shapes:update", (remoteShapes) => {
      setShapes(remoteShapes);
      historyRef.current.push(JSON.stringify(remoteShapes));
      redoRef.current = [];
    });

    return () => {
      socket.off("shapes:init");
      socket.off("shapes:update");
    };
  }, []);

  const saveSnapshot = (newShapes) => {
    historyRef.current.push(JSON.stringify(newShapes));
    redoRef.current = [];
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedShapeId != null &&
        !textInput
      ) {
        const filtered = shapes.filter((shape) => shape.id !== selectedShapeId);
        broadcastShapes(filtered);
        setSelectedShapeId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedShapeId, textInput, shapes]);

  const handleClear = () => {
    broadcastShapes([]);
    setSelectedShapeId(null);
  };

  // --- Undo/Redo fixed so no duplicate history snapshot!
  const handleUndo = () => {
    if (historyRef.current.length > 1) {
      redoRef.current.push(historyRef.current.pop());
      const prevShapes = JSON.parse(historyRef.current[historyRef.current.length - 1]);
      broadcastShapes(prevShapes, false);
      setSelectedShapeId(null);
    }
  };

  const handleRedo = () => {
    if (redoRef.current.length) {
      const curr = redoRef.current.pop();
      historyRef.current.push(curr);
      const nextShapes = JSON.parse(curr);
      broadcastShapes(nextShapes, false);
      setSelectedShapeId(null);
    }
  };

  const handlePlaceImage = () => {
    if (!imageOverlay) return;
    const newShapes = [
      ...shapes,
      {
        id: uuidv4(),
        type: "image",
        x: imageOverlay.x,
        y: imageOverlay.y,
        w: imageOverlay.width,
        h: imageOverlay.height,
        src: imageOverlay.img.src,
      },
    ];
    broadcastShapes(newShapes);
    setImageOverlay(null);
  };

  const handleUpdateShape = (updates) => {
    const newShapes = shapes.map((shape) =>
      shape.id === selectedShapeId ? { ...shape, ...updates } : shape
    );
    broadcastShapes(newShapes);
  };

  return (
    <>
      {/* Toolbar on top, always visible, on top of everything */}
      <div className="fixed top-0 left-0 w-full z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <Toolbar
            tool={tool}
            onClear={handleClear}
            setTool={setTool}
            onUndo={handleUndo}
            onRedo={handleRedo}
            color={color}
            setColor={setColor}
            eraserSize={eraserSize}
            setEraserSize={setEraserSize}
            onDownload={handleDownload}
            onUploadImage={(img) => {
              setImageOverlay({
                x: 100,
                y: 100,
                width: img.width,
                height: img.height,
                img,
              });
            }}
          />
        </div>
      </div>

      {/* Fullscreen canvas in background */}
      <div className="fixed top-0 left-0 w-screen h-screen bg-neutral-100" style={{ zIndex: 0 }}>
        <Canvas
          className="w-full h-full"
          tool={tool}
          canvasRef={canvasRef}
          color={color}
          eraserSize={eraserSize}
          shapes={shapes}
          setShapes={broadcastShapes}
          selectedShapeId={selectedShapeId}
          setSelectedShapeId={setSelectedShapeId}
          drawingEnabled={!imageOverlay && !textInput}
          saveSnapshot={saveSnapshot}
          textInput={textInput}
          setTextInput={setTextInput}
        />
        {textInput && (
          <input
            type="text"
            autoFocus
            value={textInput.value}
            style={{
              position: "absolute",
              left: textInput.x,
              top: textInput.y,
              fontSize: 22,
              color: color,
              zIndex: 20,
              minWidth: 60,
              background: "rgba(255,255,255,0.92)",
              border: "1px solid #aaa",
              padding: "2px 3px",
            }}
            onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
            onBlur={() => {
              if (textInput && textInput.value) {
                const newShape = {
                  id: uuidv4(),
                  type: "text",
                  text: textInput.value,
                  x: textInput.x,
                  y: textInput.y,
                  color,
                  fontSize: 22,
                };
                const newShapes = [...shapes, newShape];
                broadcastShapes(newShapes);
                setSelectedShapeId(newShape.id);
              }
              setTextInput(null);
              setTool("select");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.target.blur();
              if (e.key === "Escape") {
                setTextInput(null);
                setTool("select");
              }
            }}
          />
        )}
        {imageOverlay && (
          <>
            <Rnd
              size={{ width: imageOverlay.width, height: imageOverlay.height }}
              position={{ x: imageOverlay.x, y: imageOverlay.y }}
              onDragStop={(e, d) =>
                setImageOverlay((prev) => ({ ...prev, x: d.x, y: d.y }))
              }
              onResizeStop={(e, direction, ref, delta, position) =>
                setImageOverlay((prev) => ({
                  ...prev,
                  width: parseInt(ref.style.width, 10),
                  height: parseInt(ref.style.height, 10),
                  ...position,
                }))
              }
              bounds="parent"
              style={{ zIndex: 10, border: "2px dashed blue", background: "#fff5" }}
            >
              <img
                src={imageOverlay.img.src}
                alt=""
                style={{ width: "100%", height: "100%", pointerEvents: "none", userSelect: "none" }}
              />
            </Rnd>
            <button
              onClick={handlePlaceImage}
              style={{ position: "absolute", top: 12, right: 12, zIndex: 30 }}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              Place Image
            </button>
          </>
        )}
        {selectedShapeId &&
          (() => {
            const shape = shapes.find((s) => s.id === selectedShapeId);
            if (!shape) return null;

            let w, h, x, y;
            if (shape.type === "path") {
              const xs = shape.points.map((pt) => pt.x);
              const ys = shape.points.map((pt) => pt.y);
              x = Math.min(...xs);
              y = Math.min(...ys);
              w = Math.max(...xs) - x || 25;
              h = Math.max(...ys) - y || 25;
            } else if (shape.type === "text") {
              w = (shape.text?.length || 8) * (shape.fontSize || 22) * 0.6;
              h = (shape.fontSize || 22) * 1.2;
              x = shape.x;
              y = shape.y;
            } else if (shape.type === "circle") {
              const absR = Math.sqrt((shape.w || 0) ** 2 + (shape.h || 0) ** 2);
              w = absR * 2;
              h = absR * 2;
              x = shape.x - absR;
              y = shape.y - absR;
            } else {
              w = Math.abs(shape.w);
              h = Math.abs(shape.h);
              x = shape.x;
              y = shape.y;
            }

            const onMove = ({ x: nx, y: ny }) => {
              if (shape.type === "path") {
                const dx = nx - x;
                const dy = ny - y;
                handleUpdateShape({
                  points: shape.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })),
                });
              } else if (
                shape.type === "text" ||
                shape.type === "rect" ||
                shape.type === "image"
              ) {
                handleUpdateShape({ x: nx, y: ny });
              }
            };

            return (
              <Rnd
                size={{ width: w, height: h }}
                position={{ x, y }}
                enableResizing={
                  shape.type === "rect" ||
                  shape.type === "image" ||
                  shape.type === "circle"
                }
                onDragStop={(e, d) => {
                  if (shape.type === "circle") {
                    handleUpdateShape({
                      x: d.x + w / 2,
                      y: d.y + h / 2,
                    });
                  } else {
                    onMove(d);
                  }
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  if (shape.type === "rect" || shape.type === "image") {
                    handleUpdateShape({
                      x: position.x,
                      y: position.y,
                      w: parseInt(ref.style.width, 10) * Math.sign(shape.w),
                      h: parseInt(ref.style.height, 10) * Math.sign(shape.h),
                    });
                  } else if (shape.type === "circle") {
                    const newDiameter = Math.min(
                      parseInt(ref.style.width, 10),
                      parseInt(ref.style.height, 10)
                    );
                    const oldR =
                      Math.sqrt((shape.w || 0) ** 2 + (shape.h || 0) ** 2) || 1;
                    const scale = newDiameter / 2 / oldR;
                    handleUpdateShape({
                      x: position.x + newDiameter / 2,
                      y: position.y + newDiameter / 2,
                      w: (shape.w || 1) * scale,
                      h: (shape.h || 0) * scale,
                    });
                  }
                }}
                bounds="parent"
                style={{
                  zIndex: 12,
                  border: "2px dashed #34d399",
                  borderRadius: shape.type === "circle" ? "50%" : "0",
                  pointerEvents: "auto",
                  background: "transparent",
                  boxSizing: "border-box",
                }}
              >
                {shape.type === "image" ? (
                  <img
                    src={shape.src}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                    }}
                  />
                ) : shape.type === "text" ? (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      color: shape.color,
                      fontSize: shape.fontSize || 22,
                      display: "flex",
                      alignItems: "center",
                      pointerEvents: "none",
                      background: "transparent",
                    }}
                  >
                    {shape.text}
                  </div>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: shape.type === "circle" ? "50%" : "0",
                      background: "transparent",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </Rnd>
            );
          })()}
      </div>
      {selectedShapeId && (
        <button
          onClick={() => setSelectedShapeId(null)}
          className="mt-2 px-3 py-1 bg-gray-800 text-white rounded fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
        >
          Deselect
        </button>
      )}
    </>
  );
}
