import React from 'react';
import { BusPosition, DiagramBaseProps, createDiagramUtils, useOptimalLineLabelPositions, useOptimalLabelPositions, renderDiagramContent } from './DiagramBase';

// Posições para sistema de 14 barras (layout otimizado para minimizar cruzamentos)
export const busPositions14: Record<number, BusPosition> = {
  1: { x: 300, y: 100 },   // Topo esquerda
  2: { x: 500, y: 100 },   // Topo centro
  3: { x: 700, y: 100 },   // Topo direita
  4: { x: 600, y: 220 },   // Centro (hub principal)
  5: { x: 400, y: 220 },   // Centro esquerda
  6: { x: 200, y: 220 },   // Esquerda
  7: { x: 800, y: 220 },   // Centro direita
  8: { x: 1000, y: 220 },   // Direita
  9: { x: 1000, y: 360 },   // Direita inferior
  10: { x: 1000, y: 500 }, // Canto direito inferior
  11: { x: 0, y: 500 },  // Canto esquerdo inferior
  12: { x: 200, y: 360 },  // Esquerda inferior
  13: { x: 400, y: 360 },  // Centro inferior esquerda
  14: { x: 600, y: 360 }   // Centro inferior direita
};

// Para uso interno no componente
const busPositions = busPositions14;

// Interface e Props
interface Diagram14BusProps extends DiagramBaseProps {
  isResultView: boolean; // Sobrescreve para tornar obrigatório
}

const Diagram14Bus: React.FC<Diagram14BusProps> = ({
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

export default Diagram14Bus;
