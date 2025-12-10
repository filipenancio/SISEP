import React, { useState, useRef, useCallback, useEffect } from 'react';
import MessageModal from './MessageModal';
import { EditModalBus, type Bus } from './EditModalBus';
import { EditModalGenerator, type Generator } from './EditModalGenerator';
import { EditModalBranch, type Branch } from './EditModalBranch';
import { EditModalBaseValues } from './EditModalBaseValues';
import { ViewPortBaseSVG, DefaultLegend, BaseValuesDisplay, ResultTotals } from './ViewPortBaseSVG';
import { Diagram3Bus, busPositions3 } from './Diagram3Bus';
import Diagram4Bus, { busPositions4 } from './Diagram4Bus';
import Diagram5Bus, { busPositions5 } from './Diagram5Bus';
import Diagram6Bus, { busPositions6 } from './Diagram6Bus';
import Diagram9Bus, { busPositions9 } from './Diagram9Bus';
import Diagram14Bus, { busPositions14 } from './Diagram14Bus';
import { MPC, MPCResult, simulateSystem, checkLinesWithoutCapacity, applyBaseMVAToLines } from '../utils/SimulateUtils';
import { TooltipBus } from './TooltipBus';
import { TooltipGenerator } from './TooltipGenerator';
import { TooltipBranch } from './TooltipBranch';
import { TooltipLoad } from './TooltipLoad';
import { sistema3Barras } from '../data/case3p';

// Tipos baseados no formato MATPOWER
// Bus, Generator e Branch são importados dos componentes

// Dados originais do case3p.m (sistema imutável para backup)
const sistemaOriginal: MPC = sistema3Barras;

// Função auxiliar para criar deep copy do sistema original
const createDeepCopy = (obj: MPC): MPC => {
  return JSON.parse(JSON.stringify(obj));
};

// Função para determinar o tipo correto da barra baseado no gerador
const determineBusType = (bus: Bus, generator: Generator | undefined): number => {
  // Barra slack (tipo 3) nunca muda
  if (bus.type === 3) return 3;
  
  // Se não tem gerador, é PQ
  if (!generator) return 1;
  
  // Se tem gerador mas P e Q são zero, é PQ
  if (generator.Pg === 0 && generator.Qg === 0) return 1;
  
  // Se tem gerador com P ou Q diferente de zero, é PV
  return 2;
};

// Função para corrigir tipos de barra no sistema inicial
const fixInitialBusTypes = (mpc: MPC): MPC => {
  const correctedMpc = createDeepCopy(mpc);
  
  correctedMpc.bus.forEach((bus) => {
    // Se baseKV for 0, definir como 230 kV por padrão
    if (bus.baseKV === 0) {
      bus.baseKV = 230;
    }
    
    const generator = correctedMpc.gen.find(g => g.bus === bus.bus_i && g.status === 1);
    const correctType = determineBusType(bus, generator);
    
    if (bus.type !== correctType && bus.type !== 3) {
      // console.log(`Corrigindo tipo da barra ${bus.bus_i}: ${bus.type} → ${correctType}`);
      bus.type = correctType;
    }
  });
  
  return correctedMpc;
};

// Componente para Tooltip
const Tooltip: React.FC<{ 
  show: boolean; 
  x: number; 
  y: number; 
  content: React.ReactNode;
}> = ({ show, x, y, content }) => {
  if (!show) return null;
  
  return (
    <div style={{
      position: 'fixed',
      left: x + 10,
      top: y - 10,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      zIndex: 1000,
      pointerEvents: 'none',
      maxWidth: '300px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    }}>
      {content}
    </div>
  );
};

// Componente para Barra de Referência
export const ReferenceBus: React.FC<{ 
  x: number; 
  y: number; 
  label?: string; 
  bus: Bus;
  onHover: (e: React.MouseEvent, show: boolean) => void;
  onClick?: () => void;
}> = ({ x, y, label, bus, onHover, onClick }) => (
  <g 
    onMouseEnter={(e) => onHover(e, true)}
    onMouseLeave={(e) => onHover(e, false)}
    onClick={onClick}
    style={{ cursor: 'pointer' }}
  >
    <circle cx={x} cy={y} r="25" fill="#4169E1" stroke="#000" strokeWidth="3" />
    <circle cx={x} cy={y} r="12" fill="#000" />
    {label && (
      <text x={x} y={y + 50} textAnchor="middle" fill="#000" fontSize="14" fontWeight="bold">
        {label}
      </text>
    )}
  </g>
);

// Componente para Barra Normal
export const NormalBus: React.FC<{ 
  x: number; 
  y: number; 
  label?: string; 
  bus: Bus;
  onHover: (e: React.MouseEvent, show: boolean) => void;
  onClick?: () => void;
}> = ({ x, y, label, bus, onHover, onClick }) => (
  <g 
    onMouseEnter={(e) => onHover(e, true)}
    onMouseLeave={(e) => onHover(e, false)}
    onClick={onClick}
    style={{ cursor: 'pointer' }}
  >
    <circle cx={x} cy={y} r="25" fill="#4169E1" stroke="#000" strokeWidth="3" />
    {label && (
      <text x={x} y={y + 50} textAnchor="middle" fill="#000" fontSize="14" fontWeight="bold">
        {label}
      </text>
    )}
  </g>
);

// Componente para Indicativo de Barra Geradora
export const GeneratorIndicator: React.FC<{ 
  x: number; 
  y: number; 
  generator: Generator;
  onHover: (e: React.MouseEvent, show: boolean) => void;
  onClick?: () => void;
}> = ({ x, y, generator, onHover, onClick }) => (
  <g 
    onMouseEnter={(e) => onHover(e, true)}
    onMouseLeave={(e) => onHover(e, false)}
    onClick={onClick}
    style={{ cursor: 'pointer' }}
  >
    <rect x={x - 15} y={y - 15} width="30" height="30" fill="#32CD32" stroke="#000" strokeWidth="2" rx="3" />
    <polygon 
      points={`${x-8},${y+5} ${x},${y-8} ${x+8},${y+5}`} 
      fill="#FFD700" 
      stroke="#000" 
      strokeWidth="1"
    />
  </g>
);

// Componente para Indicativo de Barra com Carga
export const LoadIndicator: React.FC<{ 
  x: number; 
  y: number; 
  bus: Bus;
  onHover: (e: React.MouseEvent, show: boolean) => void;
  onClick?: () => void;
}> = ({ x, y, bus, onHover, onClick }) => (
  <g 
    onMouseEnter={(e) => onHover(e, true)}
    onMouseLeave={(e) => onHover(e, false)}
    onClick={onClick}
    style={{ cursor: 'pointer' }}
  >
    <rect x={x - 15} y={y - 15} width="30" height="30" fill="#FFB6C1" stroke="#000" strokeWidth="2" rx="3" />
    <rect x={x - 8} y={y - 8} width="16" height="12" fill="#8B4513" stroke="#000" strokeWidth="1" />
    <rect x={x - 6} y={y - 6} width="4" height="8" fill="#654321" />
    <rect x={x - 2} y={y - 6} width="4" height="8" fill="#654321" />
    <rect x={x + 2} y={y - 6} width="4" height="8" fill="#654321" />
  </g>
);

// Componente para Linha de Transmissão Neutra (pré-simulação)
export const TransmissionLineNeutral: React.FC<{ 
  x1: number; 
  y1: number; 
  x2: number; 
  y2: number; 
  label?: string;
  labelPosition?: { x: number; y: number };
  branch: Branch;
  onHover: (e: React.MouseEvent, show: boolean) => void;
  onClick?: () => void;
}> = ({ x1, y1, x2, y2, label, labelPosition, branch, onHover, onClick }) => {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  // Calcular direção para as setas (de fbus para tbus)
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const unitX = dx / length;
  const unitY = dy / length;
  
  const arrows = [];
  const numArrows = 4;
  const arrowSpacing = length / (numArrows + 1);
  
  for (let i = 1; i <= numArrows; i++) {
    const arrowX = x1 + unitX * arrowSpacing * i;
    const arrowY = y1 + unitY * arrowSpacing * i;
    const arrowSize = 8;
    
    // Pontos da seta
    const tipX = arrowX + unitX * arrowSize;
    const tipY = arrowY + unitY * arrowSize;
    const leftX = arrowX - unitX * arrowSize + unitY * arrowSize * 0.5;
    const leftY = arrowY - unitY * arrowSize - unitX * arrowSize * 0.5;
    const rightX = arrowX - unitX * arrowSize - unitY * arrowSize * 0.5;
    const rightY = arrowY - unitY * arrowSize + unitX * arrowSize * 0.5;
    
    arrows.push(
      <polygon
        key={i}
        points={`${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`}
        fill="#000"
        stroke="#000"
        strokeWidth="1"
      />
    );
  }
  
  return (
    <g onClick={onClick}>
      {/* Área de hover invisível mais larga */}
      <line 
        x1={x1} 
        y1={y1} 
        x2={x2} 
        y2={y2} 
        stroke="transparent" 
        strokeWidth="15"
        style={{ cursor: 'pointer' }}
        onMouseEnter={(e) => onHover(e, true)}
        onMouseLeave={(e) => onHover(e, false)}
      />
      
      {/* Linha cinza claro (base) */}
      <line 
        x1={x1} 
        y1={y1} 
        x2={x2} 
        y2={y2} 
        stroke="#D3D3D3" 
        strokeWidth="9"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Linha preta por cima (com as setas) */}
      <line 
        x1={x1} 
        y1={y1} 
        x2={x2} 
        y2={y2} 
        stroke="#000" 
        strokeWidth="4"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Setas */}
      {arrows}
      
      {/* Label com hover */}
      {label && (
        <text 
          x={labelPosition?.x || midX} 
          y={labelPosition?.y || (midY - 15)} 
          textAnchor="middle" 
          fill="#000" 
          fontSize="12" 
          fontWeight="bold"
          style={{ cursor: 'pointer' }}
          onMouseEnter={(e) => onHover(e, true)}
          onMouseLeave={(e) => onHover(e, false)}
        >
          {label}
        </text>
      )}
    </g>
  );
};

// Componente para o Diagrama do Sistema de 3 Barras
interface BaseBusSystemDiagramProps {
  onSimulationStatusChange?: (status: 'idle' | 'simulating' | 'result') => void;
  onSimulate?: () => Promise<void>;
  externalControls?: boolean; // Se true, não renderiza botões internos
  initialSystem?: MPC; // Sistema inicial opcional (usa sistemaOriginal se não fornecido)
}

export const BaseBusSystemDiagram: React.FC<BaseBusSystemDiagramProps> = ({ 
  onSimulationStatusChange,
  onSimulate: externalOnSimulate,
  externalControls = false,
  initialSystem
}) => {
  // Usar sistema fornecido ou padrão (3 barras)
  const systemData = initialSystem || sistemaOriginal;
  
  // Posições das barras para cada sistema
  // Usar as posições exportadas dos componentes Diagram correspondentes
  const busPositionsMaps: Record<number, Record<number, { x: number; y: number }>> = {
    3: busPositions3,
    4: busPositions4,
    5: busPositions5,
    6: busPositions6,
    9: busPositions9,
    14: busPositions14
  };

  // Calcular centro e zoom inicial baseado no número de barras
  const calculateInitialView = (numBuses: number = 3) => {
    const busPositions = busPositionsMaps[numBuses] || busPositionsMaps[3];
    const positions = Object.values(busPositions);
    
    // Calcular limites do diagrama com margem para elementos externos (gerador, carga)
    const margin = 60; // Margem para incluir indicadores de gerador e carga
    const minX = Math.min(...positions.map(p => p.x)) - margin;
    const maxX = Math.max(...positions.map(p => p.x)) + margin;
    const minY = Math.min(...positions.map(p => p.y)) - margin;
    const maxY = Math.max(...positions.map(p => p.y)) + margin;
    
    // Dimensões do diagrama
    const diagramWidth = maxX - minX;
    const diagramHeight = maxY - minY;
    const diagramCenterX = (minX + maxX) / 2;
    const diagramCenterY = (minY + maxY) / 2;
    
    // Dimensões do container visível
    const containerWidth = 1200;
    const containerHeight = 480;
    
    // Calcular zoom para usar 70% da área disponível
    const zoomX = (containerWidth * 0.7) / diagramWidth;
    const zoomY = (containerHeight * 0.7) / diagramHeight;
    const optimalZoom = Math.min(zoomX, zoomY);
    
    // Calcular pan para centralizar o diagrama no container
    const panX = (containerWidth / 2) - (diagramCenterX * optimalZoom);
    const panY = (containerHeight / 2) - (diagramCenterY * optimalZoom);
    
    return { 
      pan: { x: panX, y: panY }, 
      zoom: optimalZoom,
      centerX: diagramCenterX,
      centerY: diagramCenterY
    };
  };

  const [sistemaState, setSistemaState] = useState(() => fixInitialBusTypes(createDeepCopy(systemData)));
  const initialView = calculateInitialView(sistemaState.bus.length);
  
  const [pan, setPan] = useState(initialView.pan);
  const [zoom, setZoom] = useState(initialView.zoom);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: null as React.ReactNode });
  const [editModal, setEditModal] = useState({ 
    show: false, 
    type: '' as 'bus' | 'generator' | 'branch' | '', 
    data: null as any,
    originalData: null as any
  });
  const [confirmModal, setConfirmModal] = useState({ show: false });
  const [confirmBaseRestoreModal, setConfirmBaseRestoreModal] = useState({ show: false });
  const [generatorEditConfirmModal, setGeneratorEditConfirmModal] = useState({ show: false, generator: null as Generator | null });
  const [busTypeChangeModal, setbusTypeChangeModal] = useState({ show: false, message: '', busId: 0, newType: 1, onConfirm: () => {} });
  const [capacityWarningModal, setCapacityWarningModal] = useState({ show: false, message: '', mpc: null as MPC | null });
  const [baseModal, setBaseModal] = useState({
    show: false,
    baseMVA: systemData.baseMVA,
    baseKV: systemData.bus[0]?.baseKV || 230,
    originalBaseMVA: systemData.baseMVA,
    originalBaseKV: systemData.bus[0]?.baseKV || 230
  });
  
  // Estados para simulação
  const [simulationStatus, setSimulationStatus] = useState<'idle' | 'simulating' | 'result'>('idle');
  const [simulationResult, setSimulationResult] = useState<MPCResult | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);

  // Recalcular view quando o número de barras mudar
  useEffect(() => {
    const numBuses = sistemaState.bus.length;
    const newView = calculateInitialView(numBuses);
    setPan(newView.pan);
    setZoom(newView.zoom);
  }, [sistemaState.bus.length]);

  // Notificar mudanças de status
  React.useEffect(() => {
    onSimulationStatusChange?.(simulationStatus);
  }, [simulationStatus, onSimulationStatusChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setHasDragged(false);
    setDragStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setHasDragged(true);
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    if(e.deltaY > 0) 
      return zoomOut(); 
    
    return zoomIn(); 
  }, [zoom, pan]); // Adicionar dependências para que o callback seja atualizado

  const handleTooltip = useCallback((e: React.MouseEvent, show: boolean, content?: React.ReactNode) => {
    if (show && content) {
      setTooltip({
        show: true,
        x: e.clientX,
        y: e.clientY,
        content
      });
    } else {
      setTooltip({ show: false, x: 0, y: 0, content: null });
    }
  }, []);

  const zoomIn = () => {
    const centerX = 600; // Centro do viewBox (1200/2)
    const centerY = 240; // Centro do viewBox (480/2)
    const zoomFactor = 1.1; // Fator de zoom
    
    // Calcular novos valores baseados nos estados atuais
    const currentZoom = zoom;
    const currentPan = pan;
    const newZoom = Math.min(currentZoom * zoomFactor, 3);
    
    // Ponto do diagrama que está no centro
    const diagramX = (centerX - currentPan.x) / currentZoom;
    const diagramY = (centerY - currentPan.y) / currentZoom;
    
    // Novo pan para manter esse ponto no centro
    const newPanX = centerX - diagramX * newZoom;
    const newPanY = centerY - diagramY * newZoom;
    
    // Atualizar estados
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const zoomOut = () => {
    const centerX = 600; // Centro do viewBox (1200/2)
    const centerY = 240; // Centro do viewBox (480/2)
    const zoomFactor = 1.1; // Mesmo fator do zoom in
    
    // Calcular novos valores baseados nos estados atuais
    const currentZoom = zoom;
    const currentPan = pan;
    const newZoom = Math.max(currentZoom / zoomFactor, 0.5); 
    
    // Ponto do diagrama que está no centro
    const diagramX = (centerX - currentPan.x) / currentZoom;
    const diagramY = (centerY - currentPan.y) / currentZoom;
    
    // Novo pan para manter esse ponto no centro
    const newPanX = centerX - diagramX * newZoom;
    const newPanY = centerY - diagramY * newZoom;
    
    // Atualizar estados
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const resetView = () => {
    const numBuses = sistemaState.bus.length;
    const view = calculateInitialView(numBuses);
    setPan(view.pan);
    setZoom(view.zoom);
  };

  // Função para executar a simulação
  const handleSimulate = useCallback(async () => {
    // console.log('handleSimulate chamado', { externalOnSimulate, externalControls });
    
    if (externalOnSimulate) {
      await externalOnSimulate();
      return;
    }
    
    try {
      // console.log('Iniciando simulação...');
      setSimulationStatus('simulating');
      setSimulationError(null);
      
      const mpc: MPC = {
        version: sistemaState.version,
        baseMVA: sistemaState.baseMVA,
        bus: sistemaState.bus,
        gen: sistemaState.gen,
        branch: sistemaState.branch
      };
      
      // Verificar se há linhas sem capacidade
      const capacityCheck = checkLinesWithoutCapacity(mpc);
      if (capacityCheck.hasIssue) {
        // Mostrar modal de aviso
        setCapacityWarningModal({
          show: true,
          message: capacityCheck.message,
          mpc: mpc
        });
        setSimulationStatus('idle');
        return;
      }
      
      // console.log('MPC preparado:', mpc);
      // console.log('Geradores:', mpc.gen.map(g => ({ bus: g.bus, Pg: g.Pg, Qg: g.Qg, status: g.status })));
      const result = await simulateSystem(mpc);
      // console.log('Resultado da simulação:', result);
      setSimulationResult(result);
      setSimulationStatus('result');
      
      // Disparar evento com dados da simulação para exportação
      const simulationCompleteEvent = new CustomEvent('simulationComplete', {
        detail: { result, input: mpc }
      });
      window.dispatchEvent(simulationCompleteEvent);
    } catch (error) {
      console.error('Erro na simulação:', error);
      
      // Disparar evento de erro para a página system tratar
      const simulationErrorEvent = new CustomEvent('simulationError', {
        detail: { error }
      });
      window.dispatchEvent(simulationErrorEvent);
      
      setSimulationError(error instanceof Error ? error.message : 'Erro desconhecido');
      setSimulationStatus('idle');
    }
  }, [externalOnSimulate, sistemaState]);

  // Função para confirmar e aplicar baseMVA às linhas sem capacidade
  const confirmCapacityWarning = useCallback(async () => {
    if (!capacityWarningModal.mpc) return;
    
    try {
      setCapacityWarningModal({ show: false, message: '', mpc: null });
      setSimulationStatus('simulating');
      setSimulationError(null);
      
      // Aplicar baseMVA às linhas sem capacidade
      const updatedMPC = applyBaseMVAToLines(capacityWarningModal.mpc);
      
      // Executar a simulação com os dados corrigidos
      const result = await simulateSystem(updatedMPC);
      setSimulationResult(result);
      setSimulationStatus('result');
      
      // Disparar evento com dados da simulação para exportação
      const simulationCompleteEvent = new CustomEvent('simulationComplete', {
        detail: { result, input: updatedMPC }
      });
      window.dispatchEvent(simulationCompleteEvent);
    } catch (error) {
      console.error('Erro na simulação:', error);
      
      // Disparar evento de erro para a página system tratar
      const simulationErrorEvent = new CustomEvent('simulationError', {
        detail: { error }
      });
      window.dispatchEvent(simulationErrorEvent);
      
      setSimulationError(error instanceof Error ? error.message : 'Erro desconhecido');
      setSimulationStatus('idle');
    }
  }, [capacityWarningModal.mpc]);

  // Função para cancelar o aviso de capacidade
  const cancelCapacityWarning = useCallback(() => {
    setCapacityWarningModal({ show: false, message: '', mpc: null });
    setSimulationStatus('idle');
  }, []);

  // Escutar evento de simulação externa
  React.useEffect(() => {
    if (!externalControls) return;
    
    const handleTrigger = (e: Event) => {
      // console.log('Evento triggerSimulation recebido', e);
      handleSimulate();
    };
    
    window.addEventListener('triggerSimulation', handleTrigger as EventListener);
    return () => window.removeEventListener('triggerSimulation', handleTrigger as EventListener);
  }, [externalControls, handleSimulate]);

  // Escutar evento para voltar ao modo de edição
  React.useEffect(() => {
    if (!externalControls) return;
    
    const handleBack = (e: Event) => {
      // console.log('Evento backToEdit recebido', e);
      handleBackToEdit();
    };
    
    window.addEventListener('backToEdit', handleBack as EventListener);
    return () => window.removeEventListener('backToEdit', handleBack as EventListener);
  }, [externalControls]);

  // Função para voltar ao diagrama inicial
  const handleBackToEdit = () => {
    setSimulationStatus('idle');
    setSimulationResult(null);
  };

  // Funções para o modal de edição
  const openEditModal = (type: 'bus' | 'generator' | 'branch', data: any) => {
    setTooltip({ show: false, x: 0, y: 0, content: null });
    setEditModal({
      show: true,
      type,
      data: { ...data },
      originalData: { ...data }
    });
  };

  const closeEditModal = () => {
    setEditModal({ show: false, type: '', data: null, originalData: null });
  };

  const saveEditModal = () => {
    if (!editModal.data) return;

    const newSistema = { ...sistemaState };
    let newGeneratorAdded: Generator | null = null;
    let needsBusTypeChange = false;
    let busTypeChangeInfo = { busId: 0, oldType: 1, newType: 1, message: '' };
    
    if (editModal.type === 'bus') {
      const busIndex = newSistema.bus.findIndex((b: Bus) => b.bus_i === editModal.data.bus_i);
      if (busIndex !== -1) {
        const originalBus = sistemaState.bus[busIndex];
        const updatedBus = editModal.data;
        
        // Verificar se o status do gerador mudou
        if (originalBus.hasGenerator !== updatedBus.hasGenerator) {
          if (updatedBus.hasGenerator) {
            // Gerador foi ativado - verificar se já existe
            const existingGenIndex = newSistema.gen.findIndex((g: Generator) => g.bus === updatedBus.bus_i);
            if (existingGenIndex === -1) {
              // Verificar se existe um gerador original para esta barra
              const originalBusFromSystem = systemData.bus.find((b: Bus) => b.bus_i === updatedBus.bus_i);
              const originalGeneratorFromSystem = systemData.gen.find((g: Generator) => g.bus === updatedBus.bus_i);
              
              let newGenerator: Generator;
              
              if (originalBusFromSystem?.hasGenerator && originalGeneratorFromSystem) {
                // Restaurar gerador original
                newGenerator = { ...originalGeneratorFromSystem };
              } else {
                // Criar novo gerador com valores padrão (P=0, Q=0)
                newGenerator = {
                  bus: updatedBus.bus_i,
                  Pg: 0,
                  Qg: 0,
                  Qmax: 100,
                  Qmin: -100,
                  Vg: 1.0,
                  mBase: sistemaState.baseMVA,
                  status: 1,
                  Pmax: 100,
                  Pmin: 0
                };
              }
              
              newSistema.gen.push(newGenerator);
              newGeneratorAdded = newGenerator;
              // Não verifica P/Q aqui - o aviso só deve aparecer quando o gerador for editado/salvo
            }
          } else {
            // Gerador foi desativado/removido - remover da lista e transformar em PQ
            if (updatedBus.type !== 3) {
              const genIndex = newSistema.gen.findIndex((g: Generator) => g.bus === updatedBus.bus_i);
              if (genIndex !== -1) {
                newSistema.gen.splice(genIndex, 1);
              }
              // Transformar barra em PQ
              if (updatedBus.type !== 1) {
                updatedBus.type = 1;
                needsBusTypeChange = true;
                busTypeChangeInfo = {
                  busId: updatedBus.bus_i,
                  oldType: originalBus.type,
                  newType: 1,
                  message: `O gerador foi removido da Barra ${updatedBus.bus_i}. A barra será transformada em PQ.`
                };
              }
            }
          }
        }
        
        // Se a barra tem gerador, garantir que a tensão da barra seja igual à tensão do gerador
        // (a tensão da barra não deve ser editável quando há gerador)
        const generator = newSistema.gen.find((g: Generator) => g.bus === updatedBus.bus_i && g.status === 1);
        if (generator) {
          updatedBus.Vm = generator.Vg;
        }
        
        newSistema.bus[busIndex] = updatedBus;
      }
    } else if (editModal.type === 'generator') {
      const genIndex = newSistema.gen.findIndex((g: Generator) => g.bus === editModal.data.bus);
      if (genIndex !== -1) {
        const oldGenerator = newSistema.gen[genIndex];
        const newGenerator = editModal.data;
        const busIndex = newSistema.bus.findIndex((b: Bus) => b.bus_i === newGenerator.bus);
        
        if (busIndex !== -1) {
          // Sincronizar a tensão Vg do gerador com a tensão Vm da barra
          newSistema.bus[busIndex].Vm = newGenerator.Vg;
          
          if (newSistema.bus[busIndex].type !== 3) {
            const hadPower = oldGenerator.Pg !== 0 || oldGenerator.Qg !== 0;
            const hasPower = newGenerator.Pg !== 0 || newGenerator.Qg !== 0;
            
            // Caso 1: Gerador estava com P=0 e Q=0, mas agora tem potência
            if (!hadPower && hasPower) {
              needsBusTypeChange = true;
              busTypeChangeInfo = {
                busId: newGenerator.bus,
                oldType: newSistema.bus[busIndex].type,
                newType: 2,
                message: `O gerador da Barra ${newGenerator.bus} agora possui geração. A barra será transformada em PV.`
              };
              newSistema.bus[busIndex].type = 2;
            }
            // Caso 2: Gerador tinha potência, mas agora P=0 e Q=0
            else if (hadPower && !hasPower) {
              needsBusTypeChange = true;
              const willChange = newSistema.bus[busIndex].type !== 1;
              busTypeChangeInfo = {
                busId: newGenerator.bus,
                oldType: newSistema.bus[busIndex].type,
                newType: 1,
                message: willChange
                  ? `O gerador da Barra ${newGenerator.bus} foi definido com P = 0 e Q = 0. O gerador será desconsiderado e a barra será transformada em PQ.`
                  : `O gerador da Barra ${newGenerator.bus} possui P = 0 e Q = 0. O gerador será desconsiderado (barra já é do tipo PQ).`
              };
              newSistema.bus[busIndex].type = 1;
            }
            // Caso 3: Gerador continua com P=0 e Q=0 (primeira edição após criação ou edição sem mudança)
            else if (!hadPower && !hasPower) {
              needsBusTypeChange = true;
              const willChange = newSistema.bus[busIndex].type !== 1;
              busTypeChangeInfo = {
                busId: newGenerator.bus,
                oldType: newSistema.bus[busIndex].type,
                newType: 1,
                message: willChange
                  ? `O gerador da Barra ${newGenerator.bus} possui P = 0 e Q = 0. O gerador será desconsiderado e a barra será transformada em PQ.`
                  : `O gerador da Barra ${newGenerator.bus} possui P = 0 e Q = 0. O gerador será desconsiderado (barra já é do tipo PQ).`
              };
              newSistema.bus[busIndex].type = 1;
            }
          }
        }
        
        newSistema.gen[genIndex] = newGenerator;
      }
    } else if (editModal.type === 'branch') {
      const branchIndex = newSistema.branch.findIndex((b: Branch) => 
        b.fbus === editModal.data.fbus && b.tbus === editModal.data.tbus
      );
      if (branchIndex !== -1) {
        newSistema.branch[branchIndex] = editModal.data;
      }
    }

    // Salvar o sistema
    setSistemaState(newSistema);
    closeEditModal();
    
    // Mostrar modal de aviso se houver mudança de tipo de barra
    if (needsBusTypeChange) {
      setbusTypeChangeModal({
        show: true,
        message: busTypeChangeInfo.message,
        busId: busTypeChangeInfo.busId,
        newType: busTypeChangeInfo.newType,
        onConfirm: () => setbusTypeChangeModal({ show: false, message: '', busId: 0, newType: 1, onConfirm: () => {} })
      });
    }
    
    // Se um novo gerador foi adicionado, perguntar se quer editar
    if (newGeneratorAdded) {
      setGeneratorEditConfirmModal({ show: true, generator: newGeneratorAdded });
    }
  };

  const restoreOriginalData = () => {
    if (editModal.originalData) {
      setConfirmModal({ show: true });
    }
  };

  const confirmRestore = () => {
    if (editModal.originalData) {
      if (editModal.type === 'bus') {
        // Restaurar dados da barra do sistema original
        const originalBus = systemData.bus.find((b: Bus) => b.bus_i === editModal.originalData.bus_i);
        if (originalBus) {
          // Criar uma cópia completa dos dados originais da barra, incluindo hasGenerator
          const restoredBusData = { ...originalBus };
          
          // Manter o baseKV atual (definido globalmente)
          const currentBus = sistemaState.bus.find((b: Bus) => b.bus_i === editModal.originalData.bus_i);
          if (currentBus) {
            restoredBusData.baseKV = currentBus.baseKV;
            
            // Se a barra tem gerador, manter a tensão do gerador
            const currentGenerator = sistemaState.gen.find((g: Generator) => g.bus === currentBus.bus_i);
            if (currentGenerator) {
              restoredBusData.Vm = currentGenerator.Vg;
            }
          }
          
          setEditModal(prev => ({
            ...prev,
            data: restoredBusData
          }));
        }
      } else if (editModal.type === 'generator') {
        // Restaurar dados do gerador do sistema original
        const originalGenerator = systemData.gen.find((g: Generator) => g.bus === editModal.originalData.bus);
        if (originalGenerator) {
          const restoredGeneratorData = { ...originalGenerator };
          
          setEditModal(prev => ({
            ...prev,
            data: restoredGeneratorData
          }));
        }
      } else if (editModal.type === 'branch') {
        // Restaurar dados da linha do sistema original
        const originalBranch = systemData.branch.find((b: Branch) => 
          b.fbus === editModal.originalData.fbus && b.tbus === editModal.originalData.tbus
        );
        if (originalBranch) {
          const restoredBranchData = { ...originalBranch };
          
          // Manter o baseMVA atual (definido globalmente)
          restoredBranchData.baseMVA = sistemaState.baseMVA;
          
          setEditModal(prev => ({
            ...prev,
            data: restoredBranchData
          }));
        }
      }
    }
    setConfirmModal({ show: false });
  };

  const cancelRestore = () => {
    setConfirmModal({ show: false });
  };

  const confirmEditGenerator = () => {
    if (generatorEditConfirmModal.generator) {
      openEditModal('generator', generatorEditConfirmModal.generator);
    }
    setGeneratorEditConfirmModal({ show: false, generator: null });
  };

  const cancelEditGenerator = () => {
    setGeneratorEditConfirmModal({ show: false, generator: null });
  };

  // Função para gerar mensagem de restauração baseada no tipo
  const getRestoreMessage = () => {
    if (!editModal.type) return { title: 'Confirmar Restauração', message: 'Tem certeza que deseja restaurar os dados originais?' };
    
    switch (editModal.type) {
      case 'bus':
        return {
          title: `Restauração da Barra ${editModal.data?.bus_i}`,
          message: `Tem certeza que deseja restaurar a Barra?<br/><br/>Obs.: Todos os parâmetros da barra e seu gerador (se houver) voltarão ao estado inicial.`
        };
      case 'generator':
        return {
          title: `Restauração do Gerador (Barra ${editModal.data?.bus})`,
          message: `Tem certeza que deseja restaurar o Gerador?<br/><br/>Obs.: Todos os parâmetros de geração voltarão ao estado inicial.`
        };
      case 'branch':
        return {
          title: `Restauração da Linha (L${editModal.data?.fbus}-${editModal.data?.tbus})`,
          message: `Tem certeza que deseja restaurar a Linha?<br/><br/>Obs.: Todos os parâmetros elétricos voltarão ao estado inicial.`
        };
      default:
        return {
          title: 'Confirmar Restauração',
          message: 'Tem certeza que deseja restaurar os dados originais?'
        };
    }
  };

  // Função para verificar se uma barra tem gerador
  const hasGenerator = (busNumber: number) => {
    return sistemaState.gen.some((gen: Generator) => gen.bus === busNumber && gen.status === 1);
  };

  // Funções para o modal de bases
  const openBaseModal = () => {
    setBaseModal({
      show: true,
      baseMVA: sistemaState.baseMVA,
      baseKV: sistemaState.bus[0]?.baseKV || 230,
      originalBaseMVA: systemData.baseMVA,
      originalBaseKV: systemData.bus[0]?.baseKV || 230
    });
  };

  const closeBaseModal = () => {
    // Ao fechar o modal, restaurar os valores do sistema atual (desfazer alterações não salvas)
    setBaseModal(prev => ({
      ...prev,
      show: false,
      baseMVA: sistemaState.baseMVA,
      baseKV: sistemaState.bus[0]?.baseKV || 230
    }));
  };

  const saveBaseModal = () => {
    const newSistema = { ...sistemaState };
    
    // Atualizar baseMVA do sistema
    newSistema.baseMVA = baseModal.baseMVA;
    
    // Atualizar mBase de todos os geradores com o novo baseMVA
    newSistema.gen = newSistema.gen.map((gen: Generator) => ({
      ...gen,
      mBase: baseModal.baseMVA
    }));
    
    // Atualizar baseKV em todas as barras
    newSistema.bus = newSistema.bus.map((bus: Bus) => ({
      ...bus,
      baseKV: baseModal.baseKV
    }));
    
    // Atualizar baseMVA em todas as linhas
    newSistema.branch = newSistema.branch.map((branch: Branch) => ({
      ...branch,
      baseMVA: baseModal.baseMVA
    }));
    
    setSistemaState(newSistema);
    closeBaseModal();
  };

  const restoreBaseValues = () => {
    setConfirmBaseRestoreModal({ show: true });
  };

  const confirmRestoreBaseValues = () => {
    setBaseModal(prev => ({
      ...prev,
      baseMVA: prev.originalBaseMVA,
      baseKV: prev.originalBaseKV
    }));
    setConfirmBaseRestoreModal({ show: false });
  };

  const cancelRestoreBaseValues = () => {
    setConfirmBaseRestoreModal({ show: false });
  };

  // Função para verificar se uma barra tem carga
  const hasLoad = (busNumber: number) => {
    const bus = sistemaState.bus.find((b: Bus) => b.bus_i === busNumber);
    return bus && bus.Pd > 0;
  };

  // Função para obter dados do gerador
  const getGenerator = (busNumber: number) => {
    return sistemaState.gen.find((gen: Generator) => gen.bus === busNumber && gen.status === 1);
  };

  // Função para criar tooltip de barra
  const createBusTooltip = (bus: Bus) => {
    const busResult = simulationResult?.bus.find(b => b.bus_id === bus.bus_i);
    return (
      <TooltipBus 
        bus={bus} 
        busResult={busResult} 
        isResultView={simulationStatus === 'result'} 
      />
    );
  };

  // Função para criar tooltip de gerador
  const createGeneratorTooltip = (gen: Generator) => {
    const genResult = simulationResult?.generators.find(g => g.bus_id === gen.bus);
    const extGridResult = simulationResult?.ext_grid.find(eg => eg.bus_id === gen.bus);
    return (
      <TooltipGenerator 
        generator={gen} 
        generatorResult={genResult}
        extGridResult={extGridResult}
        isResultView={simulationStatus === 'result'} 
      />
    );
  };

  // Função para criar tooltip de linha
  const createBranchTooltip = (branch: Branch) => {
    const lineResult = simulationResult?.lines.find(l => 
      (l.from_bus === branch.fbus && l.to_bus === branch.tbus) ||
      (l.from_bus === branch.tbus && l.to_bus === branch.fbus)
    );
    return (
      <TooltipBranch 
        branch={branch} 
        lineResult={lineResult} 
        isResultView={simulationStatus === 'result'} 
      />
    );
  };

  // Função para criar tooltip de carga
  const createLoadTooltip = (bus: Bus) => {
    const loadResult = simulationResult?.loads.find(l => l.bus_id === bus.bus_i);
    return (
      <TooltipLoad 
        bus={bus} 
        loadResult={loadResult} 
        isResultView={simulationStatus === 'result'} 
      />
    );
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '480px',
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: '#ffffff',
      cursor: isDragging ? 'grabbing' : 'grab'
    }}>
      {/* Tooltip */}
      <Tooltip {...tooltip} />
      {/* ViewPort com diagrama */}
      <ViewPortBaseSVG
        legend={<DefaultLegend includeResultLines={simulationStatus === 'result'} />}
        baseValues={<BaseValuesDisplay baseMVA={sistemaState.baseMVA} baseKV={sistemaState.bus[0]?.baseKV || 230} />}
        onBaseValuesClick={simulationStatus === 'idle' ? openBaseModal : undefined}
        resultTotals={
          simulationStatus === 'result' && simulationResult ? (
            <ResultTotals
              genCapacityP={simulationResult.genCapacityP}
              genCapacityQmin={simulationResult.genCapacityQmin}
              genCapacityQmax={simulationResult.genCapacityQmax}
              loadSystemP={simulationResult.loadSystemP}
              loadSystemQ={simulationResult.loadSystemQ}
              totalPLossMW={simulationResult.lines.reduce((sum, line) => sum + Math.abs(line.p_loss_mw), 0)}
              totalQLossMVAr={simulationResult.lines.reduce((sum, line) => sum + Math.abs(line.q_loss_mvar), 0)}
            />
          ) : undefined
        }
        initialZoom={initialView.zoom}
        initialPan={initialView.pan}
      >
        {(() => {
          const numBuses = sistemaState.bus.length;
          const DiagramComponent = numBuses === 4 ? Diagram4Bus : 
                                   numBuses === 5 ? Diagram5Bus :
                                   numBuses === 6 ? Diagram6Bus :
                                   numBuses === 9 ? Diagram9Bus :
                                   numBuses === 14 ? Diagram14Bus :
                                   Diagram3Bus;
          
          return (
            <DiagramComponent
              buses={sistemaState.bus}
              generators={sistemaState.gen}
              branches={sistemaState.branch}
              lineResults={simulationResult?.lines}
              isResultView={simulationStatus === 'result'}
              onBusClick={(bus) => openEditModal('bus', bus)}
              onGeneratorClick={(gen) => openEditModal('generator', gen)}
              onBranchClick={(branch) => openEditModal('branch', branch)}
              onLoadClick={(bus) => openEditModal('bus', bus)}
              onBusHover={(e, show, bus) => handleTooltip(e, show, bus ? createBusTooltip(bus) : undefined)}
              onGeneratorHover={(e, show, gen) => handleTooltip(e, show, gen ? createGeneratorTooltip(gen) : undefined)}
              onBranchHover={(e, show, branch) => handleTooltip(e, show, branch ? createBranchTooltip(branch) : undefined)}
              onLoadHover={(e, show, bus) => handleTooltip(e, show, bus ? (simulationStatus === 'result' ? createLoadTooltip(bus) : createBusTooltip(bus)) : undefined)}
              hasDragged={hasDragged}
            />
          );
        })()}
      </ViewPortBaseSVG>

      {/* Botão Simular - aparece quando está no modo edição e não está usando controles externos */}
      {!externalControls && simulationStatus === 'idle' && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 20
        }}>
          <button
            onClick={handleSimulate}
            style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#218838';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#28a745';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            SIMULAR
          </button>
        </div>
      )}

      {/* Indicador de simulação em andamento - não mostra se usando controles externos */}
      {!externalControls && simulationStatus === 'simulating' && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 20,
          padding: '12px 24px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #003366',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}/>
          <span style={{ fontWeight: 'bold', color: '#003366' }}>SIMULANDO...</span>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Botões de Ação do Resultado - não mostra se usando controles externos */}
      {!externalControls && simulationStatus === 'result' && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 20,
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={handleBackToEdit}
            style={{
              padding: '10px 20px',
              backgroundColor: '#003366',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#004488';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#003366';
            }}
          >
            VOLTAR PARA EDIÇÃO
          </button>
        </div>
      )}

      {/* Modais de Edição */}
      <EditModalBus
        show={editModal.show && editModal.type === 'bus'}
        data={editModal.data}
        busResult={simulationResult?.bus.find(b => b.bus_id === editModal.data?.bus_i)}
        onClose={closeEditModal}
        onSave={saveEditModal}
        onRestore={restoreOriginalData}
        onChange={(newData) => setEditModal(prev => ({ ...prev, data: newData }))}
        viewOnly={simulationStatus === 'result'}
      />

      <EditModalGenerator
        show={editModal.show && editModal.type === 'generator'}
        data={editModal.data}
        generatorResult={simulationResult?.generators.find(g => g.bus_id === editModal.data?.bus)}
        extGridResult={simulationResult?.ext_grid.find(eg => eg.bus_id === editModal.data?.bus)}
        onClose={closeEditModal}
        onSave={saveEditModal}
        onRestore={restoreOriginalData}
        onChange={(newData) => setEditModal(prev => ({ ...prev, data: newData }))}
        viewOnly={simulationStatus === 'result'}
      />

      <EditModalBranch
        show={editModal.show && editModal.type === 'branch'}
        data={editModal.data}
        lineResult={
          simulationResult?.lines.find(l => 
            (l.from_bus === editModal.data?.fbus && l.to_bus === editModal.data?.tbus) ||
            (l.from_bus === editModal.data?.tbus && l.to_bus === editModal.data?.fbus)
          )
        }
        onClose={closeEditModal}
        onSave={saveEditModal}
        onRestore={restoreOriginalData}
        onChange={(newData) => setEditModal(prev => ({ ...prev, data: newData }))}
        viewOnly={simulationStatus === 'result'}
      />

      {/* Modal de Edição de Bases */}
      <EditModalBaseValues
        show={baseModal.show}
        baseMVA={baseModal.baseMVA}
        baseKV={baseModal.baseKV}
        onClose={closeBaseModal}
        onSave={saveBaseModal}
        onRestore={restoreBaseValues}
        onChangeBaseMVA={(value) => setBaseModal(prev => ({ ...prev, baseMVA: value }))}
        onChangeBaseKV={(value) => setBaseModal(prev => ({ ...prev, baseKV: value }))}
      />

      <MessageModal
        show={confirmModal.show}
        title={getRestoreMessage().title}
        message={<span dangerouslySetInnerHTML={{ __html: getRestoreMessage().message }} />}
        buttons={[
          {
            label: 'Não',
            onClick: cancelRestore,
            variant: 'secondary'
          },
          {
            label: 'Sim',
            onClick: confirmRestore,
            variant: 'primary'
          }
        ]}
      />

      <MessageModal
        show={confirmBaseRestoreModal.show}
        title="Restauração dos Valores Base"
        message={
          <>
            Tem certeza que deseja restaurar os valores base?<br/><br/>
            Obs.: Os valores de Base MVA e Base kV voltarão ao estado inicial.
          </>
        }
        buttons={[
          {
            label: 'Não',
            onClick: cancelRestoreBaseValues,
            variant: 'secondary'
          },
          {
            label: 'Sim',
            onClick: confirmRestoreBaseValues,
            variant: 'primary'
          }
        ]}
      />

      <MessageModal
        show={generatorEditConfirmModal.show}
        title="Gerador Adicionado"
        message={
          <>
            Um novo gerador foi adicionado à Barra {generatorEditConfirmModal.generator?.bus} com valores padrão.<br/>
            Deseja editar os parâmetros do gerador agora?
          </>
        }
        buttons={[
          {
            label: 'Não',
            onClick: cancelEditGenerator,
            variant: 'secondary'
          },
          {
            label: 'Sim',
            onClick: confirmEditGenerator,
            variant: 'primary'
          }
        ]}
      />

      <MessageModal
        show={busTypeChangeModal.show}
        title="Mudança de Tipo de Barra"
        message={
          <>
            {busTypeChangeModal.message}
          </>
        }
        buttons={[
          {
            label: 'OK',
            onClick: () => busTypeChangeModal.onConfirm(),
            variant: 'primary'
          }
        ]}
      />

      <MessageModal
        show={capacityWarningModal.show}
        title="Aviso: Linhas sem Capacidade"
        message={
          <>
            {capacityWarningModal.message.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < capacityWarningModal.message.split('\n').length - 1 && <br />}
              </span>
            ))}
          </>
        }
        buttons={[
          {
            label: 'Cancelar',
            onClick: cancelCapacityWarning,
            variant: 'secondary'
          },
          {
            label: 'Continuar',
            onClick: confirmCapacityWarning,
            variant: 'primary'
          }
        ]}
      />

      {/* Tooltip */}
      <Tooltip 
        show={tooltip.show} 
        x={tooltip.x} 
        y={tooltip.y} 
        content={tooltip.content} 
      />
    </div>
  );
};