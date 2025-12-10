import React from 'react';
import { BusPosition, DiagramBaseProps, createDiagramUtils, useOptimalLineLabelPositions, useOptimalLabelPositions, renderDiagramContent } from './DiagramBase';

// Posições para sistema de 6 barras (layout com boa distribuição)
export const busPositions6: Record<number, BusPosition> = {
  1: { x: 200, y: 150 },   // Topo esquerda (gerador)
  2: { x: 500, y: 150 },   // Topo centro (gerador)
  3: { x: 800, y: 150 },   // Topo direita (gerador)
  4: { x: 300, y: 400 },   // Base esquerda (carga)
  5: { x: 500, y: 400 },   // Base centro (carga)
  6: { x: 700, y: 400 }    // Base direita (carga)
};

// Para uso interno no componente
const busPositions = busPositions6;

// Interface e Props
interface Diagram6BusProps extends DiagramBaseProps {
  isResultView: boolean; // Sobrescreve para tornar obrigatório
}

const Diagram6Bus: React.FC<Diagram6BusProps> = ({
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

export default Diagram6Bus;
