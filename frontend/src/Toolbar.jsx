import {
  Undo, Redo, ImageUp, LetterText, CircleDashed, SquareDashed,
  Eraser, Pen, VectorSquare, RotateCcw, ArrowDownToLine
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/shadcn-io/dock';

// Utility hook to detect mobile screens (Tailwind 'md')
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  return isMobile;
}

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
  const isMobile = useIsMobile();
  const orientation = isMobile ? 'vertical' : 'horizontal';

  // For mobile: make dock smaller, shift left, lower magnification, distance, tighter gap.
  const dockProps = isMobile ? {
    orientation: 'vertical',
    className: 'md:hidden', // hide vertical dock on desktop
    panelHeight: 54,
    magnification: 48,
    distance: 60,
  } : {
    orientation: 'horizontal',
    className: 'items-center bg-gradient-to-br from-blue-200 to-violet-400 px-8 mt-0',
    panelHeight: 64,
    magnification: 80,
    distance: 150,
  };

  const showEraserSlider = tool === 'eraser';

  return (
    <div className={isMobile ? 'w-fit' : 'w-full flex mt-5 justify-center relative'}>
      {!isMobile && (
        <h2 className="text-4xl font-light mt-5 ml-5 font-borel select-none fixed left-0">Colla<span className='text-violet-500'>Art</span></h2>
      )}
      <Dock {...dockProps}>
        <DockItem>
          <DockLabel>Select</DockLabel>
          <DockIcon>
            <button onClick={() => setTool('select')}>
              <VectorSquare className="w-6 h-6" />
            </button>
          </DockIcon>
        </DockItem>
        <DockItem>
          <DockLabel>Pencil</DockLabel>
          <DockIcon>
            <button onClick={() => setTool('pencil')}>
              <Pen className="w-6 h-6" />
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
              className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
              title="Pick Pencil/Shape Color"
              style={{ background: "none" }}
            />
          </DockIcon>
        </DockItem>
        <DockItem>
          <DockLabel>Eraser</DockLabel>
          <DockIcon>
            <button onClick={() => setTool('eraser')}>
              <Eraser className="w-6 h-6" />
            </button>
            {showEraserSlider && (
              <input
                type="range"
                min="5"
                max="50"
                value={eraserSize}
                onChange={e => {
                  setEraserSize(Number(e.target.value));
                  setTool('eraser');
                }}
                className="absolute left-1/2 top-full -mt-2 -translate-x-1/2 w-20 cursor-pointer rounded bg-gray-200 z-100 shadow"
                title="Eraser Size"
                style={{
                  accentColor: "#B57ADE"
                }}
              />
            )}
          </DockIcon>
        </DockItem>
        <DockItem>
          <DockLabel>Rectangle</DockLabel>
          <DockIcon>
            <button onClick={() => setTool('rect')}>
              <SquareDashed className="w-6 h-6" />
            </button>
          </DockIcon>
        </DockItem>
        <DockItem>
          <DockLabel>Circle</DockLabel>
          <DockIcon>
            <button onClick={() => setTool('circle')}>
              <CircleDashed className="w-6 h-6" />
            </button>
          </DockIcon>
        </DockItem>
        <DockItem>
          <DockLabel>Text</DockLabel>
          <DockIcon>
            <button onClick={() => setTool('text')}>
              <LetterText className="w-6 h-6" />
            </button>
          </DockIcon>
        </DockItem>
        <DockItem>
          <DockLabel>Undo</DockLabel>
          <DockIcon>
            <button onClick={onUndo}>
              <Undo className="w-6 h-6" />
            </button>
          </DockIcon>
        </DockItem>
        <DockItem>
          <DockLabel>Redo</DockLabel>
          <DockIcon>
            <button onClick={onRedo}>
              <Redo className="w-6 h-6" />
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
                    const reader = new window.FileReader();
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
                <ImageUp className="w-6 h-6" />
              </label>
            </>
          </DockIcon>
        </DockItem>
        <DockItem>
          <DockLabel>Download</DockLabel>
          <DockIcon>
            <button onClick={onDownload} title="Download Whiteboard">
              <ArrowDownToLine className="w-6 h-6" />
            </button>
          </DockIcon>
        </DockItem>
        <DockItem className="-mr-3">
          <DockLabel>Clear All</DockLabel>
          <DockIcon>
            <button onClick={onClear}>
              <RotateCcw className="w-6 h-6" />
            </button>
          </DockIcon>
        </DockItem>
      </Dock>
    </div>
  );
};

export default Toolbar;
