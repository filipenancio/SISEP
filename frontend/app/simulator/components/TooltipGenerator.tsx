import React from 'react';
import { Generator } from './EditModalGenerator';

interface GeneratorResultData {
  bus_id: number;
  p_mw: number;
  q_mvar: number;
  vm_pu: number;
}

interface ExtGridResultData {
  bus_id: number;
  p_mw: number;
  q_mvar: number;
  vm_pu: number;
}

interface TooltipGeneratorProps {
  generator: Generator;
  generatorResult?: GeneratorResultData;
  extGridResult?: ExtGridResultData;
  isResultView?: boolean;
}

export const TooltipGenerator: React.FC<TooltipGeneratorProps> = ({ 
  generator, 
  generatorResult, 
  extGridResult,
  isResultView = false 
}) => {
  const hasResult = generatorResult || extGridResult;
  
  return (
    <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
      <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>
        Gerador - Barra {generator.bus}
      </div>
      {isResultView ? (
        <>
          {generatorResult ? (
            <>
              <div>P: {generatorResult.p_mw.toFixed(2)} MW</div>
              <div>Q: {generatorResult.q_mvar.toFixed(2)} MVAr</div>
              <div>V: {generatorResult.vm_pu.toFixed(3)} pu</div>
            </>
          ) : extGridResult ? (
            <>
              <div>P: {extGridResult.p_mw.toFixed(2)} MW</div>
              <div>Q: {extGridResult.q_mvar.toFixed(2)} MVAr</div>
              <div>V: {extGridResult.vm_pu.toFixed(3)} pu</div>
            </>
          ) : (
            <>
              <div>P: 0.00 MW</div>
              <div>Q: 0.00 MVAr</div>
              <div>V: 1.000 pu</div>
            </>
          )}
        </>
      ) : (
        <>
          <div>Vm: {generator.Vg.toFixed(3)} pu</div>
          <div>Pg: {generator.Pg.toFixed(1)} MW</div>
          <div>Qg: {generator.Qg.toFixed(1)} MVAr</div>
          <div>Pmax: {generator.Pmax.toFixed(1)} MW</div>
          <div>Pmin: {generator.Pmin.toFixed(1)} MW</div>
          <div>Qmax: {generator.Qmax.toFixed(1)} MVAr</div>
          <div>Qmin: {generator.Qmin.toFixed(1)} MVAr</div>
          <div>Status: {generator.status === 1 ? 'Ativo' : 'Inativo'}</div>
        </>
      )}
    </div>
  );
};
