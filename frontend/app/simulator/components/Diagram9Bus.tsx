import React from 'react';
import { BusPosition, DiagramBaseProps, createDiagramUtils, useOptimalLineLabelPositions, useOptimalLabelPositions, renderDiagramContent } from './DiagramBase';

// Posições para sistema de 9 barras (layout em círculo com geradores no topo)
export const busPositions9: Record<number, BusPosition> = {
  1: { x: 200, y: 200 },   // Topo esquerda (gerador)
  2: { x: 800, y: 200 },   // Topo direita (gerador)
  3: { x: 800, y: 400 },  // Direita (gerador)
  4: { x: 400, y: 200 },   // Esquerda-centro
  5: { x: 400, y: 400 },   // Esquerda-baixo (carga)
  6: { x: 600, y: 400 },   // Centro-baixo
  7: { x: 600, y: 200 },   // Centro (carga)
  8: { x: 600, y: 0 },   // Direita-baixo
  9: { x: 400, y: 0 }    // Centro-cima (carga)
};

// Para uso interno no componente
const busPositions = busPositions9;

// Interface e Props
interface Diagram9BusProps extends DiagramBaseProps {
  isResultView: boolean; // Sobrescreve para tornar obrigatório
}

const Diagram9Bus: React.FC<Diagram9BusProps> = ({
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

export default Diagram9Bus;
