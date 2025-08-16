import {
  Undo, Redo, ImageUp, LetterText, CircleDashed, SquareDashed,
  Eraser, Pen, VectorSquare, RotateCcw, ArrowDownToLine
} from 'lucide-react';
import { useState } from 'react';
import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/shadcn-io/dock';

const Toolbar = ({
  tool,
  onClear,
  setTool,
  onUndo,
  onRedo,
  color,
  setColor,
  eraserSize,
  setEraserSize,
  onUploadImage,
  onDownload,
}) => {
  // Track if eraser slider should be shown based on active tool
  const showEraserSlider = tool === 'eraser';

  return (
    <div className="w-full flex mt-5 justify-center relative">
      <h2 className="text-4xl font-light mt-5 ml-5 font-borel select-none fixed left-0">Colla<span className='text-violet-500'>Art</span></h2>
      <Dock className="items-center bg-gradient-to-br from-blue-200 to-violet-400 px-8  ">


        <DockItem>
          <DockLabel>Select</DockLabel>
          <DockIcon>
            <button onClick={() => setTool("select")}>
              <VectorSquare />
            </button>
          </DockIcon>
        </DockItem>

        <DockItem>
          <DockLabel>Pencil</DockLabel>
          <DockIcon>
            <button onClick={() => setTool("pencil")}>
              <Pen />
            </button>
          </DockIcon>
        </DockItem>

        <DockItem>
          <DockLabel>Color</DockLabel>
          <DockIcon>
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer"
              title="Pick Pencil/Shape Color"
              style={{ background: "none" }}
            />
          </DockIcon>
        </DockItem>

        <DockItem>
          <DockLabel>Eraser</DockLabel>
          <DockIcon>
            <button onClick={() => setTool("eraser")}>
              <Eraser />
            </button>
            {showEraserSlider && (
              <input
                type="range"
                min="5"
                max="50"
                value={eraserSize}
                onChange={e => {
                  setEraserSize(Number(e.target.value));
                  setTool('eraser'); // ensure tool stays eraser on change
                }}
                className="absolute left-1/2 top-full mt-2 -translate-x-1/2 w-28 cursor-pointer rounded bg-gray-200 z-50 shadow"
                title="Eraser Size"
                style={{
    accentColor: "#B57ADE" // green-600, or use your preferred color hex
  }}
              />
            )}
          </DockIcon>
        </DockItem>

        <DockItem>
          <DockLabel>Rectangle</DockLabel>
          <DockIcon>
            <button onClick={() => setTool("rect")}>
              <SquareDashed />
            </button>
          </DockIcon>
        </DockItem>

        <DockItem>
          <DockLabel>Circle</DockLabel>
          <DockIcon>
            <button onClick={() => setTool("circle")}>
              <CircleDashed />
            </button>
          </DockIcon>
        </DockItem>

        <DockItem>
          <DockLabel>Text</DockLabel>
          <DockIcon>
            <button onClick={() => setTool("text")}>
              <LetterText />
            </button>
          </DockIcon>
        </DockItem>

        <DockItem>
          <DockLabel>Undo</DockLabel>
          <DockIcon>
            <button onClick={onUndo}>
              <Undo />
            </button>
          </DockIcon>
        </DockItem>

        <DockItem>
          <DockLabel>Redo</DockLabel>
          <DockIcon>
            <button onClick={onRedo}>
              <Redo />
            </button>
          </DockIcon>
        </DockItem>

        <DockItem>
          <DockLabel>Image Upload</DockLabel>
          <DockIcon>
            <>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      const img = new window.Image();
                      img.src = reader.result;
                      img.onload = () => {
                        onUploadImage(img);
                      };
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
                id="imageUpload"
              />
              <label htmlFor="imageUpload" className="cursor-pointer">
                <ImageUp />
              </label>
            </>
          </DockIcon>
        </DockItem>

        <DockItem>
          <DockLabel>Download</DockLabel>
          <DockIcon>
            <button onClick={onDownload} title="Download Whiteboard">
              <ArrowDownToLine />
            </button>
          </DockIcon>
        </DockItem>

        <DockItem className="-mr-3">
          <DockLabel>Clear All</DockLabel>
          <DockIcon>
            <button onClick={onClear}>
              <RotateCcw />
            </button>
          </DockIcon>
        </DockItem>
      </Dock>
    </div>
  );
};

export default Toolbar;
