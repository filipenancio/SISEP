import React, { useMemo } from 'react';
import { Branch } from './EditModalBranch';
import { Bus } from './EditModalBus';
import { Generator } from './EditModalGenerator';
import { calculateOptimalLabelPositions, calculateOptimalLineLabelPositions } from '../utils/LabelPositioning';
import { GeneratorIndicator, LoadIndicator, TransmissionLineNeutral } from './PowerSystemElements';

/**
 * Interface para resultados de fluxo de potência em linhas de transmissão
 */
export interface LineResult {
  from_bus: number;
  to_bus: number;
  p_from_mw: number;
  q_from_mvar: number;
  p_to_mw: number;
  q_to_mvar: number;
  p_loss_mw: number;
  q_loss_mvar: number;
  loading_percent: number;
}

/**
 * Interface para posição de barra no diagrama
 */
export interface BusPosition {
  x: number;
  y: number;
}

/**
 * Interface base para props de componentes de diagrama
 */
export interface DiagramBaseProps {
  buses: Bus[];
  generators: Generator[];
  branches: Branch[];
  lineResults?: LineResult[];
  isResultView?: boolean;
  onBusClick?: (bus: Bus) => void;
  onGeneratorClick?: (generator: Generator) => void;
  onBranchClick?: (branch: Branch) => void;
  onLoadClick?: (bus: Bus) => void;
  onBusHover?: (e: React.MouseEvent, show: boolean, bus?: Bus) => void;
  onGeneratorHover?: (e: React.MouseEvent, show: boolean, generator?: Generator) => void;
  onBranchHover?: (e: React.MouseEvent, show: boolean, branch?: Branch) => void;
  onLoadHover?: (e: React.MouseEvent, show: boolean, bus?: Bus) => void;
  hasDragged?: boolean;
}

/**
 * Funções utilitárias comuns para diagramas
 */
export const createDiagramUtils = (generators: Generator[], buses: Bus[], lineResults?: LineResult[]) => {
  return {
    getGenerator: (busId: number): Generator | undefined => {
      return generators.find(gen => gen.bus === busId && gen.status === 1);
    },

    hasLoad: (busId: number): boolean => {
      const bus = buses.find(b => b.bus_i === busId);
      return bus ? (bus.Pd > 0 || bus.Qd > 0) : false;
    },

    getLineResult: (fbus: number, tbus: number): LineResult | undefined => {
      if (!lineResults) return undefined;
      return lineResults.find(lr => 
        (lr.from_bus === fbus && lr.to_bus === tbus) ||
        (lr.from_bus === tbus && lr.to_bus === fbus)
      );
    }
  };
};

/**
 * Hook para calcular posições otimizadas dos labels de linhas
 */
export const useOptimalLineLabelPositions = (
  buses: Bus[],
  branches: Branch[],
  generators: Generator[],
  busPositions: Record<number, BusPosition>
) => {
  const { getGenerator, hasLoad } = createDiagramUtils(generators, buses, undefined);
  
  return useMemo(() => {
    const busData = buses.map(bus => {
      const pos = busPositions[bus.bus_i];
      return {
        id: bus.bus_i,
        x: pos?.x || 0,
        y: pos?.y || 0,
        hasGenerator: !!getGenerator(bus.bus_i),
        hasLoad: hasLoad(bus.bus_i)
      };
    }).filter(b => b.x !== 0 || b.y !== 0);

    const branchData = branches.map(b => ({
      from: b.fbus,
      to: b.tbus,
      label: `L${b.fbus}-${b.tbus}`
    }));

    return calculateOptimalLineLabelPositions(branchData, busPositions, busData);
  }, [buses, branches, generators, busPositions]);
};

/**
 * Hook para calcular posições otimizadas dos labels de barras
 */
export const useOptimalLabelPositions = (
  buses: Bus[],
  branches: Branch[],
  generators: Generator[],
  busPositions: Record<number, BusPosition>
) => {
  const { getGenerator, hasLoad } = createDiagramUtils(generators, buses, undefined);
  
  return useMemo(() => {
    const busData = buses.map(bus => {
      const pos = busPositions[bus.bus_i];
      return {
        id: bus.bus_i,
        x: pos?.x || 0,
        y: pos?.y || 0,
        label: `Barra ${bus.bus_i}`,
        hasGenerator: !!getGenerator(bus.bus_i),
        hasLoad: hasLoad(bus.bus_i)
      };
    }).filter(b => b.x !== 0 || b.y !== 0);

    const branchData = branches.map(b => ({
      from: b.fbus,
      to: b.tbus
    }));

    return calculateOptimalLabelPositions(busData, branchData, busPositions);
  }, [buses, branches, generators, busPositions]);
};

/**
 * Calcula a cor da linha baseada no carregamento
 */
export const calculateLineColors = (loading: number): { lineColor: string; strokeColor: string } => {
  let lineColor: string;
  let strokeColor: string;
  
  if (loading <= 50) {
    // Verde
    lineColor = '#90EE90';
    strokeColor = '#228B22';
  } else if (loading <= 70) {
    // Amarelo
    lineColor = '#FFFF99';
    strokeColor = '#FFD700';
  } else if (loading <= 90) {
    // Laranja
    lineColor = '#FFB347';
    strokeColor = '#FF8C00';
  } else if (loading <= 100.01) {
    // Vermelho
    lineColor = '#FF6B6B';
    strokeColor = '#DC143C';
  } else {
    // Roxo/Violeta escuro
    lineColor = '#6a2166ff';
    strokeColor = '#2e054bff';
  }
  
  return { lineColor, strokeColor };
};

/**
 * Calcula o carregamento percentual da linha
 */
export const calculateLineLoading = (branch: Branch, lineResult: LineResult): number => {
  const potencyNumerator = Math.max(Math.abs(lineResult.p_from_mw), Math.abs(lineResult.p_to_mw));
  const denom = (branch.rateA || branch.baseMVA);
  const multiply = (branch.rateA == branch.baseMVA ? 1 : 100);
  return (potencyNumerator / denom) * multiply;
};

/**
 * Gera as setas de fluxo de potência para linha de transmissão
 */
export const generateFlowArrows = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  shouldInvertArrows: boolean,
  arrowColor: string = '#000000',
  numArrows: number = 4
): React.ReactElement[] => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Inverter direção se necessário
  const unitX = shouldInvertArrows ? -(dx / length) : (dx / length);
  const unitY = shouldInvertArrows ? -(dy / length) : (dy / length);
  
  // Ponto inicial das setas (invertido se necessário)
  const startX = shouldInvertArrows ? x2 : x1;
  const startY = shouldInvertArrows ? y2 : y1;

  const arrows = [];
  const arrowSpacing = length / (numArrows + 1);

  for (let i = 1; i <= numArrows; i++) {
    const arrowX = startX + unitX * arrowSpacing * i;
    const arrowY = startY + unitY * arrowSpacing * i;
    const arrowSize = 8;

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
        fill={arrowColor}
        stroke={arrowColor}
        strokeWidth="1"
      />
    );
  }

  return arrows;
};

/**
 * Componente para Linha de Transmissão com Resultado (colorida baseada no carregamento)
 */
export const TransmissionLineResult: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
  labelPosition?: { x: number; y: number };
  branch: Branch;
  lineResult: LineResult;
  onHover: (e: React.MouseEvent, show: boolean) => void;
  onClick?: () => void;
}> = ({ x1, y1, x2, y2, label, labelPosition, branch, lineResult, onHover, onClick }) => {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Calcular carregamento e cores
  const loading = calculateLineLoading(branch, lineResult);
  const { lineColor, strokeColor } = calculateLineColors(loading);
  
  // Setas sempre pretas
  const arrowColor = '#000000';

  // Determinar direção da seta baseado no sinal do fluxo de potência ativa
  // Se p_from_mw >= 0, fluxo vai de fbus para tbus (direção normal)
  // Se p_from_mw < 0, fluxo vai de tbus para fbus (direção invertida)
  const shouldInvertArrows = lineResult.p_from_mw < 0;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Gerar setas
  const arrows = generateFlowArrows(x1, y1, x2, y2, shouldInvertArrows, arrowColor, 4);

  return (
    <g onClick={onClick}>
      <rect
        x={midX - length / 2}
        y={midY - 7}
        width={length}
        height={14}
        fill={lineColor}
        stroke={strokeColor}
        strokeWidth="2"
        rx="3"
        transform={`rotate(${Math.atan2(dy, dx) * 180 / Math.PI}, ${midX}, ${midY})`}
      />
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
      {arrows}
      {label && (
        <text
          x={labelPosition?.x || midX}
          y={labelPosition?.y || (midY - 15)}
          textAnchor="middle"
          fill="#000"
          fontSize="12"
          fontWeight="bold"
          style={{ cursor: 'pointer', pointerEvents: 'none' }}
        >
          {label}
        </text>
      )}
    </g>
  );
};

/**
 * Renderiza as linhas de transmissão (branches) com ou sem resultados
 */
export const renderTransmissionLines = (
  branches: Branch[],
  busPositions: Record<number, BusPosition>,
  isResultView: boolean,
  lineResults: LineResult[] | undefined,
  getLineResult: (fbus: number, tbus: number) => LineResult | undefined,
  optimalLineLabelPositions: Map<string, { x: number; y: number }>,
  onBranchHover?: (e: React.MouseEvent, show: boolean, branch?: Branch) => void,
  onBranchClick?: (branch: Branch) => void,
  hasDragged?: boolean
) => {
  return branches.map((branch: Branch, index: number) => {
    const pos1 = busPositions[branch.fbus];
    const pos2 = busPositions[branch.tbus];
    if (!pos1 || !pos2) return null;

    const lineKey = `${branch.fbus}-${branch.tbus}`;
    const lineLabelPos = optimalLineLabelPositions.get(lineKey);

    if (isResultView && lineResults) {
      const lineResult = getLineResult(branch.fbus, branch.tbus);
      if (!lineResult) return null;

      return (
        <TransmissionLineResult
          key={index}
          x1={pos1.x}
          y1={pos1.y}
          x2={pos2.x}
          y2={pos2.y}
          label={`L${branch.fbus}-${branch.tbus}`}
          labelPosition={lineLabelPos}
          branch={branch}
          lineResult={lineResult}
          onHover={(e, show) => onBranchHover && onBranchHover(e, show, show ? branch : undefined)}
          onClick={() => {
            if (!hasDragged && onBranchClick) onBranchClick(branch);
          }}
        />
      );
    } else {
      return (
        <TransmissionLineNeutral
          key={index}
          x1={pos1.x}
          y1={pos1.y}
          x2={pos2.x}
          y2={pos2.y}
          label={`L${branch.fbus}-${branch.tbus}`}
          labelPosition={lineLabelPos}
          branch={branch}
          onHover={(e, show) => onBranchHover && onBranchHover(e, show, show ? branch : undefined)}
          onClick={() => {
            if (!hasDragged && onBranchClick) onBranchClick(branch);
          }}
        />
      );
    }
  });
};

/**
 * Componente genérico para renderizar o conteúdo completo de um diagrama
 */
export const renderDiagramContent = (
  buses: Bus[],
  branches: Branch[],
  generators: Generator[],
  lineResults: LineResult[] | undefined,
  busPositions: Record<number, BusPosition>,
  optimalLabelPositions: Map<number, { x: number; y: number }>,
  optimalLineLabelPositions: Map<string, { x: number; y: number }>,
  isResultView: boolean,
  getGenerator: (busId: number) => Generator | undefined,
  getLineResult: (fbus: number, tbus: number) => LineResult | undefined,
  hasLoad: (busId: number) => boolean,
  onBusClick?: (bus: Bus) => void,
  onGeneratorClick?: (generator: Generator) => void,
  onBranchClick?: (branch: Branch) => void,
  onLoadClick?: (bus: Bus) => void,
  onBusHover?: (e: React.MouseEvent, show: boolean, bus?: Bus) => void,
  onGeneratorHover?: (e: React.MouseEvent, show: boolean, generator?: Generator) => void,
  onBranchHover?: (e: React.MouseEvent, show: boolean, branch?: Branch) => void,
  onLoadHover?: (e: React.MouseEvent, show: boolean, bus?: Bus) => void,
  hasDragged?: boolean
) => {
  return (
    <>
      {/* Linhas de transmissão */}
      {branches.map((branch: Branch, index: number) => {
        const pos1 = busPositions[branch.fbus];
        const pos2 = busPositions[branch.tbus];
        if (!pos1 || !pos2) return null;

        if (isResultView && lineResults) {
          const lineResult = getLineResult(branch.fbus, branch.tbus);
          if (!lineResult) return null;

          const lineKey = `${branch.fbus}-${branch.tbus}`;
          const lineLabelPos = optimalLineLabelPositions.get(lineKey);

          return (
            <TransmissionLineResult
              key={index}
              x1={pos1.x}
              y1={pos1.y}
              x2={pos2.x}
              y2={pos2.y}
              label={`L${branch.fbus}-${branch.tbus}`}
              labelPosition={lineLabelPos}
              branch={branch}
              lineResult={lineResult}
              onHover={(e, show) => onBranchHover && onBranchHover(e, show, show ? branch : undefined)}
              onClick={() => {
                if (!hasDragged && onBranchClick) onBranchClick(branch);
              }}
            />
          );
        } else {
          const lineKey = `${branch.fbus}-${branch.tbus}`;
          const lineLabelPos = optimalLineLabelPositions.get(lineKey);

          return (
            <TransmissionLineNeutral
              key={index}
              x1={pos1.x}
              y1={pos1.y}
              x2={pos2.x}
              y2={pos2.y}
              label={`L${branch.fbus}-${branch.tbus}`}
              labelPosition={lineLabelPos}
              branch={branch}
              onHover={(e, show) => onBranchHover && onBranchHover(e, show, show ? branch : undefined)}
              onClick={() => {
                if (!hasDragged && onBranchClick) onBranchClick(branch);
              }}
            />
          );
        }
      })}

      {/* Barras */}
      {buses.map((bus: Bus) => {
        const pos = busPositions[bus.bus_i];
        if (!pos) return null;

        const labelPos = optimalLabelPositions.get(bus.bus_i);
        
        return (
          <g key={bus.bus_i}>
            {/* Renderizar círculo da barra */}
            <g
              onMouseEnter={(e) => onBusHover && onBusHover(e, true, bus)}
              onMouseLeave={(e) => onBusHover && onBusHover(e, false, undefined)}
              onClick={() => {
                if (!hasDragged && onBusClick) onBusClick(bus);
              }}
              style={{ cursor: 'pointer' }}
            >
              {bus.type === 3 ? (
                <>
                  <circle cx={pos.x} cy={pos.y} r="25" fill="#4169E1" stroke="#000" strokeWidth="3" />
                  <circle cx={pos.x} cy={pos.y} r="12" fill="#000" />
                </>
              ) : (
                <circle cx={pos.x} cy={pos.y} r="25" fill="#4169E1" stroke="#000" strokeWidth="3" />
              )}
            </g>
            
            {/* Renderizar label na posição otimizada */}
            {labelPos && (
              <text 
                x={labelPos.x} 
                y={labelPos.y} 
                textAnchor="middle" 
                fill="#000" 
                fontSize="14" 
                fontWeight="bold"
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => onBusHover && onBusHover(e, true, bus)}
                onMouseLeave={(e) => onBusHover && onBusHover(e, false, undefined)}
                onClick={() => {
                  if (!hasDragged && onBusClick) onBusClick(bus);
                }}
              >
                Barra {bus.bus_i}
              </text>
            )}
          </g>
        );
      })}

      {/* Indicadores de Geradores */}
      {buses.map((bus: Bus) => {
        const generator = getGenerator(bus.bus_i);
        if (!generator) return null;

        const pos = busPositions[bus.bus_i];
        if (!pos) return null;

        return (
          <GeneratorIndicator
            key={`gen-${bus.bus_i}`}
            x={pos.x - 30}
            y={pos.y - 30}
            generator={generator}
            onHover={(e, show) => onGeneratorHover && onGeneratorHover(e, show, show ? generator : undefined)}
            onClick={() => {
              if (!hasDragged && onGeneratorClick) onGeneratorClick(generator);
            }}
          />
        );
      })}

      {/* Indicadores de Cargas */}
      {buses.map((bus: Bus) => {
        if (!hasLoad(bus.bus_i)) return null;

        const pos = busPositions[bus.bus_i];
        if (!pos) return null;

        return (
          <LoadIndicator
            key={`load-${bus.bus_i}`}
            x={pos.x + 30}
            y={pos.y - 30}
            bus={bus}
            onHover={(e, show) => onLoadHover && onLoadHover(e, show, show ? bus : undefined)}
            onClick={() => {
              if (!hasDragged && onLoadClick) onLoadClick(bus);
            }}
          />
        );
      })}
    </>
  );
};

