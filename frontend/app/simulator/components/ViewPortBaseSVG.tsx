import React, { useState, useRef, useEffect } from 'react';

export interface ViewPortBaseSVGProps {
  children: React.ReactNode;
  legend: React.ReactNode;
  baseValues: React.ReactNode;
  onBaseValuesClick?: () => void;
  resultTotals?: React.ReactNode;
  initialZoom?: number;
  initialPan?: { x: number; y: number };
}

export const ViewPortBaseSVG: React.FC<ViewPortBaseSVGProps> = ({
  children,
  legend,
  baseValues,
  onBaseValuesClick,
  resultTotals,
  initialZoom = 1,
  initialPan = { x: 0, y: 0 }
}) => {
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState(initialPan);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Funções de controle de zoom e pan
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * delta, 0.3), 3);
    
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const viewBoxWidth = 1200;
      const viewBoxHeight = 480;
      const scaleX = viewBoxWidth / rect.width;
      const scaleY = viewBoxHeight / rect.height;
      
      const svgX = mouseX * scaleX;
      const svgY = mouseY * scaleY;
      
      const worldX = (svgX - pan.x) / zoom;
      const worldY = (svgY - pan.y) / zoom;
      
      const newPanX = svgX - worldX * newZoom;
      const newPanY = svgY - worldY * newZoom;
      
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    }
  };

  // Adicionar event listener para wheel com passive: false
  useEffect(() => {
    const svg = svgRef.current;
    if (svg) {
      svg.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        svg.removeEventListener('wheel', handleWheel);
      };
    }
  }, [zoom, pan]); // Dependências necessárias para o handleWheel

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 0) {
      setIsDragging(true);
      setHasDragged(false);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPan({ x: newX, y: newY });
      setHasDragged(true);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 3);
    setZoom(newZoom);
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoom * 0.8, 0.3);
    setZoom(newZoom);
  };

  const resetView = () => {
    setZoom(initialZoom);
    setPan(initialPan);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#ffffff', overflow: 'hidden' }}>
            {/* Controles de Zoom */}
      <div className="zoom-controls" style={{
        position: 'absolute', top: '15px', right: '15px', zIndex: 10,
        display: 'flex', flexDirection: 'column', gap: '8px'
      }}>
        <button 
          onClick={zoomIn}
          style={{
            width: '36px', height: '36px', fontSize: '20px',
            backgroundColor: 'white', border: '1px solid #ccc',
            borderRadius: '4px', cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="Zoom In"
        >
          +
        </button>
        <button 
          onClick={zoomOut}
          style={{
            width: '36px', height: '36px', fontSize: '20px',
            backgroundColor: 'white', border: '1px solid #ccc',
            borderRadius: '4px', cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="Zoom Out"
        >
          −
        </button>
        <button 
          onClick={resetView}
          style={{
            width: '36px', height: '36px', fontSize: '16px',
            backgroundColor: 'white', border: '1px solid #ccc',
            borderRadius: '4px', cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="Reset View"
        >
          ⌂
        </button>
      </div>

      {/* Legenda */}
      <div className="legend-box" style={{
        position: 'absolute', top: '15px', left: '15px', zIndex: 10,
        backgroundColor: 'rgba(245, 245, 245, 0.95)', border: '1px solid #ccc',
        borderRadius: '4px', padding: '12px', width: '170px', fontSize: '9px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {legend}
      </div>

      {/* Informações Base */}
      <div 
        className="base-values-box"
        onClick={onBaseValuesClick}
        style={{
          position: 'absolute', bottom: '15px', left: '15px', zIndex: 10,
          backgroundColor: 'rgba(245, 245, 245, 0.95)', border: '1px solid #ccc',
          borderRadius: '4px', padding: '12px', width: '170px', fontSize: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          cursor: onBaseValuesClick ? 'pointer' : 'default',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => onBaseValuesClick && (e.currentTarget.style.backgroundColor = 'rgba(230, 230, 230, 0.95)')}
        onMouseLeave={(e) => onBaseValuesClick && (e.currentTarget.style.backgroundColor = 'rgba(245, 245, 245, 0.95)')}
      >
        {baseValues}
      </div>

      {/* Totalizadores (apenas no modo resultado) */}
      {resultTotals && (
        <div className="result-totals-box" style={{
          position: 'absolute', bottom: '15px', right: '15px', zIndex: 10,
          backgroundColor: 'rgba(245, 245, 245, 0.95)', border: '1px solid #ccc',
          borderRadius: '4px', padding: '12px', width: '200px', fontSize: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {resultTotals}
        </div>
      )}

      {/* Legenda fixa */}
      <div style={{
        position: 'absolute', top: '15px', left: '15px', zIndex: 10,
        backgroundColor: 'rgba(245, 245, 245, 0.95)', border: '1px solid #ccc',
        borderRadius: '4px', padding: '12px', width: '170px', fontSize: '9px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {legend}
      </div>

      {/* Informações Base */}
      <div 
        onClick={onBaseValuesClick}
        style={{
          position: 'absolute', bottom: '15px', left: '15px', zIndex: 10,
          backgroundColor: 'rgba(245, 245, 245, 0.95)', border: '1px solid #ccc',
          borderRadius: '4px', padding: '12px', width: '170px', fontSize: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          cursor: onBaseValuesClick ? 'pointer' : 'default',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => onBaseValuesClick && (e.currentTarget.style.backgroundColor = 'rgba(230, 230, 230, 0.95)')}
        onMouseLeave={(e) => onBaseValuesClick && (e.currentTarget.style.backgroundColor = 'rgba(245, 245, 245, 0.95)')}
      >
        {baseValues}
      </div>

      {/* Totalizadores (apenas no modo resultado) */}
      {resultTotals && (
        <div style={{
          position: 'absolute', bottom: '15px', right: '15px', zIndex: 10,
          backgroundColor: 'rgba(245, 245, 245, 0.95)', border: '1px solid #ccc',
          borderRadius: '4px', padding: '12px', width: '200px', fontSize: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {resultTotals}
        </div>
      )}

      {/* Diagrama SVG */}
      <div style={{ width: '100%', height: '100%' }}>
        <svg 
          ref={svgRef}
          width="100%" 
          height="100%" 
          viewBox="0 0 1200 480" 
          preserveAspectRatio="xMidYMid meet"
          style={{ 
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            display: 'block'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <rect width="1200" height="480" fill="#ffffff" />
          
          {/* Grupo com transformação para pan e zoom */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {children}
          </g>
        </svg>
      </div>
    </div>
  );
};

// Componente auxiliar para a legenda padrão
export const DefaultLegend: React.FC<{ includeResultLines?: boolean }> = ({ includeResultLines = false }) => (
  <>
    <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px', marginBottom: '10px', color: '#333' }}>Legenda</div>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
      <svg width="22" height="18" style={{ marginRight: '10px' }}>
        <circle cx="11" cy="9" r="8" fill="#4169E1" stroke="#000" strokeWidth="1" />
        <circle cx="11" cy="9" r="4" fill="#000" />
      </svg>
      <span style={{ color: '#333' }}>Barra de Referência</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
      <svg width="22" height="18" style={{ marginRight: '10px' }}>
        <circle cx="11" cy="9" r="8" fill="#4169E1" stroke="#000" strokeWidth="1" />
      </svg>
      <span style={{ color: '#333' }}>Barra</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
      <svg width="22" height="18" style={{ marginRight: '10px' }}>
        <rect x="4" y="3" width="15" height="13" fill="#32CD32" stroke="#000" strokeWidth="1" rx="2" />
        <polygon points="7,12 11,5 15,12" fill="#FFD700" stroke="#000" strokeWidth="0.5" />
      </svg>
      <span style={{ color: '#333' }}>Barra geradora</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
      <svg width="22" height="18" style={{ marginRight: '10px' }}>
        <rect x="4" y="3" width="15" height="13" fill="#FFB6C1" stroke="#000" strokeWidth="1" rx="2" />
        <rect x="7" y="6" width="9" height="6" fill="#8B4513" stroke="#000" strokeWidth="0.5" />
        <rect x="8" y="7" width="2" height="4" fill="#654321" />
        <rect x="10.5" y="7" width="2" height="4" fill="#654321" />
        <rect x="13" y="7" width="2" height="4" fill="#654321" />
      </svg>
      <span style={{ color: '#333' }}>Barra com carga</span>
    </div>
    {includeResultLines ? (
      <>
        {/* Linha separadora após título */}
          <div style={{
            height: '1px',
            backgroundColor: '#d3d3d3',
            margin: '4px 0',
            marginBottom: '20px'
        }}></div>
        <div style={{ marginBottom: '10px', fontSize: '11px', color: '#555', fontWeight: '500' }}>
          Carregamento das Linhas:
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <svg width="22" height="18" style={{ marginRight: '10px' }}>
            <rect x="2" y="7" width="19" height="5" fill="#90EE90" stroke="#228B22" strokeWidth="1" rx="2" />
            <polygon points="16,9.5 14,8 14,11" fill="#000" stroke="#000" strokeWidth="0.5" />
          </svg>
          <span style={{ color: '#333', fontSize: '10px' }}>≤ 50% - Normal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <svg width="22" height="18" style={{ marginRight: '10px' }}>
            <rect x="2" y="7" width="19" height="5" fill="#FFFF99" stroke="#FFD700" strokeWidth="1" rx="2" />
            <polygon points="16,9.5 14,8 14,11" fill="#000" stroke="#000" strokeWidth="0.5" />
          </svg>
          <span style={{ color: '#333', fontSize: '10px' }}>51-70% - Moderado</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <svg width="22" height="18" style={{ marginRight: '10px' }}>
            <rect x="2" y="7" width="19" height="5" fill="#FFB347" stroke="#FF8C00" strokeWidth="1" rx="2" />
            <polygon points="16,9.5 14,8 14,11" fill="#000" stroke="#000" strokeWidth="0.5" />
          </svg>
          <span style={{ color: '#333', fontSize: '10px' }}>71-90% - Elevado</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <svg width="22" height="18" style={{ marginRight: '10px' }}>
            <rect x="2" y="7" width="19" height="5" fill="#FF6B6B" stroke="#DC143C" strokeWidth="1" rx="2" />
            <polygon points="16,9.5 14,8 14,11" fill="#000" stroke="#000" strokeWidth="0.5" />
          </svg>
          <span style={{ color: '#333', fontSize: '10px' }}>91-100% - Crítico</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <svg width="22" height="18" style={{ marginRight: '10px' }}>
            <rect x="2" y="7" width="19" height="5" fill="#9370DB" stroke="#4B0082" strokeWidth="1" rx="2" />
            <polygon points="16,9.5 14,8 14,11" fill="#000" stroke="#000" strokeWidth="0.5" />
          </svg>
          <span style={{ color: '#333', fontSize: '10px' }}>&gt; 100% - Sobrecarga</span>
        </div>
      </>
    ) : (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <svg width="22" height="18" style={{ marginRight: '10px' }}>
          <rect x="2" y="7" width="19" height="5" fill="#D3D3D3" stroke="#A9A9A9" strokeWidth="1" rx="2" />
          <line x1="3" y1="9.5" x2="18" y2="9.5" stroke="#000" strokeWidth="1" />
          <polygon points="16,9.5 14,8 14,11" fill="#000" stroke="#000" strokeWidth="0.5" />
        </svg>
        <span style={{ color: '#333' }}>Linha de transmissão</span>
      </div>
    )}
  </>
);

// Componente auxiliar para valores base
export const BaseValuesDisplay: React.FC<{ baseMVA: number; baseKV: number }> = ({ baseMVA, baseKV }) => (
  <>
    <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px', marginBottom: '10px', color: '#333' }}>Valores Base</div>
    <div style={{ marginBottom: '6px', color: '#333' }}>
      <span style={{ fontWeight: 'bold' }}>Base MVA:</span> {baseMVA} MVA
    </div>
    <div style={{ color: '#333' }}>
      <span style={{ fontWeight: 'bold' }}>Base kV:</span> {baseKV} kV
    </div>
  </>
);

// Componente para totalizadores do resultado
export const ResultTotals: React.FC<{
  genCapacityP: number;
  genCapacityQmin: number;
  genCapacityQmax: number;
  loadSystemP: number;
  loadSystemQ: number;
  totalPLossMW: number;
  totalQLossMVAr: number;
}> = ({ genCapacityP, genCapacityQmin, genCapacityQmax, loadSystemP, loadSystemQ, totalPLossMW, totalQLossMVAr }) => (
  <>
    <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px', marginBottom: '10px', color: '#333' }}>Totalizadores</div>
    
    <div style={{ marginBottom: '8px' }}>
      <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#666', marginBottom: '4px' }}>Capacidade de Geração:</div>
      <div style={{ fontSize: '10px', color: '#333', marginLeft: '8px' }}>
        <div>P: {genCapacityP.toFixed(2)} MW</div>
        <div>Q mín: {genCapacityQmin.toFixed(2)} MVAr</div>
        <div>Q máx: {genCapacityQmax.toFixed(2)} MVAr</div>
      </div>
    </div>
    
    <div style={{ marginBottom: '8px' }}>
      <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#666', marginBottom: '4px' }}>Carga do Sistema:</div>
      <div style={{ fontSize: '10px', color: '#333', marginLeft: '8px' }}>
        <div>P: {loadSystemP.toFixed(2)} MW</div>
        <div>Q: {loadSystemQ.toFixed(2)} MVAr</div>
      </div>
    </div>
    
    <div>
      <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#666', marginBottom: '4px' }}>Perdas Totais:</div>
      <div style={{ fontSize: '10px', color: '#333', marginLeft: '8px' }}>
        <div>P: {totalPLossMW.toFixed(2)} MW</div>
        <div>Q: {totalQLossMVAr.toFixed(2)} MVAr</div>
      </div>
    </div>
  </>
);
