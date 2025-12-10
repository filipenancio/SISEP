import React from 'react';
import { BusPosition, DiagramBaseProps, createDiagramUtils, useOptimalLineLabelPositions, useOptimalLabelPositions, renderDiagramContent } from './DiagramBase';

// Posições para sistema de 4 barras (retangular com bom espaçamento)
export const busPositions4: Record<number, BusPosition> = {
  1: { x: 280, y: 200 },
  2: { x: 650, y: 200 },
  3: { x: 280, y: 450 },
  4: { x: 650, y: 450 }
};

// Para uso interno no componente
const busPositions = busPositions4;

// Interface e Props
interface Diagram4BusProps extends DiagramBaseProps {
  isResultView: boolean; // Sobrescreve para tornar obrigatório
}

const Diagram4Bus: React.FC<Diagram4BusProps> = ({
  buses,
  generators,
  branches,
  lineResults,
  isResultView,
  onBusClick,
  onGeneratorClick,
  onBranchClick,
  onLoadClick,
  onBusHover,
  onGeneratorHover,
  onBranchHover,
  onLoadHover,
  hasDragged
}) => {
  const { getGenerator, hasLoad, getLineResult } = createDiagramUtils(generators, buses, lineResults);

  // Calcular posições otimizadas dos labels usando hooks
  const optimalLabelPositions = useOptimalLabelPositions(buses, branches, generators, busPositions);
  const optimalLineLabelPositions = useOptimalLineLabelPositions(buses, branches, generators, busPositions);

  return renderDiagramContent(
    buses,
    branches,
    generators,
    lineResults,
    busPositions,
    optimalLabelPositions,
    optimalLineLabelPositions,
    isResultView,
    getGenerator,
    getLineResult,
    hasLoad,
    onBusClick,
    onGeneratorClick,
    onBranchClick,
    onLoadClick,
    onBusHover,
    onGeneratorHover,
    onBranchHover,
    onLoadHover,
    hasDragged
  );
};

export default Diagram4Bus;
