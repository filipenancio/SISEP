import React from 'react';
import { BusPosition, DiagramBaseProps, createDiagramUtils, useOptimalLineLabelPositions, useOptimalLabelPositions, renderDiagramContent } from './DiagramBase';


// Posições para sistema de 5 barras (pentágono)
export const busPositions5: Record<number, BusPosition> = {
  1: { x: 300, y: 100 },
  2: { x: 450, y: 220 },
  3: { x: 380, y: 400 },
  4: { x: 220, y: 400 },
  5: { x: 150, y: 220 }
};

// Para uso interno no componente
const busPositions = busPositions5;

// Interface e Props
interface Diagram5BusProps extends DiagramBaseProps {
  isResultView: boolean; // Sobrescreve para tornar obrigatório
}

const Diagram5Bus: React.FC<Diagram5BusProps> = ({
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

export default Diagram5Bus;
