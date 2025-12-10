import React from 'react';
import { EditModalBase } from './EditModalBase';
import { LineResult } from './Diagram3Bus';
import { NumericInput } from './NumericInput';

export interface Branch {
  fbus: number;
  tbus: number;
  r: number;
  x: number;
  b: number;
  rateA: number;
  rateB: number;
  rateC: number;
  ratio: number;
  angle: number;
  status: number;
  angmin: number;
  angmax: number;
  baseMVA: number;
}

interface EditModalBranchProps {
  show: boolean;
  data: Branch | null;
  lineResult?: LineResult;
  onClose: () => void;
  onSave?: () => void;
  onRestore?: () => void;
  onChange?: (newData: Branch) => void;
  viewOnly?: boolean;
}

export const EditModalBranch: React.FC<EditModalBranchProps> = ({
  show,
  data,
  lineResult,
  onClose,
  onSave,
  onRestore,
  onChange,
  viewOnly = false
}) => {
  if (!data) return null;

  const isResultView = viewOnly && lineResult;

  const renderField = (label: string, key: keyof Branch, unit: string, min?: number, max?: number, step?: number) => (
    <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
      <label style={{ 
        minWidth: '130px', 
        marginRight: '10px', 
        fontWeight: 'bold',
        fontSize: '12px',
        color: '#000'
      }}>
        {label}:
      </label>
      <NumericInput
        value={data[key] as number}
        onChange={viewOnly ? () => {} : (value: number) => onChange?.({ ...data, [key]: value })}
        min={min}
        max={max}
        step={step || 0.01}
        disabled={viewOnly}
        style={{ width: '200px', backgroundColor: viewOnly ? '#f5f5f5' : 'white', cursor: viewOnly ? 'default' : 'text' }}
      />
      <span style={{ 
        marginLeft: '8px', 
        fontSize: '12px', 
        color: '#666',
        minWidth: '50px'
      }}>
        {unit}
      </span>
    </div>
  );

  return (
    <EditModalBase
      show={show}
      title={`Edição de Linha (L${data.fbus}-${data.tbus})`}
      onClose={onClose}
      onSave={onSave}
      onRestore={onRestore}
      viewOnly={viewOnly}
    >
      <div>
        {isResultView ? (
          // Visualização de Resultado
          <>
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <label style={{ 
                minWidth: '130px', 
                marginRight: '10px', 
                fontWeight: 'bold',
                fontSize: '12px',
                color: '#000'
              }}>
                Pot. Ativa (de):
              </label>
              <span style={{
                width: '200px',
                padding: '6px 8px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#666'
              }}>
                {lineResult.p_from_mw.toFixed(2)}
              </span>
              <span style={{ 
                marginLeft: '8px', 
                fontSize: '12px', 
                color: '#666',
                minWidth: '50px'
              }}>
                MW
              </span>
            </div>

            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <label style={{ 
                minWidth: '130px', 
                marginRight: '10px', 
                fontWeight: 'bold',
                fontSize: '12px',
                color: '#000'
              }}>
                Pot. Reativa (de):
              </label>
              <span style={{
                width: '200px',
                padding: '6px 8px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#666'
              }}>
                {lineResult.q_from_mvar.toFixed(2)}
              </span>
              <span style={{ 
                marginLeft: '8px', 
                fontSize: '12px', 
                color: '#666',
                minWidth: '50px'
              }}>
                MVAr
              </span>
            </div>

            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <label style={{ 
                minWidth: '130px', 
                marginRight: '10px', 
                fontWeight: 'bold',
                fontSize: '12px',
                color: '#000'
              }}>
                Pot. Ativa (para):
              </label>
              <span style={{
                width: '200px',
                padding: '6px 8px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#666'
              }}>
                {lineResult.p_to_mw.toFixed(2)}
              </span>
              <span style={{ 
                marginLeft: '8px', 
                fontSize: '12px', 
                color: '#666',
                minWidth: '50px'
              }}>
                MW
              </span>
            </div>

            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <label style={{ 
                minWidth: '130px', 
                marginRight: '10px', 
                fontWeight: 'bold',
                fontSize: '12px',
                color: '#000'
              }}>
                Pot. Reativa (para):
              </label>
              <span style={{
                width: '200px',
                padding: '6px 8px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#666'
              }}>
                {lineResult.q_to_mvar.toFixed(2)}
              </span>
              <span style={{ 
                marginLeft: '8px', 
                fontSize: '12px', 
                color: '#666',
                minWidth: '50px'
              }}>
                MVAr
              </span>
            </div>

            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <label style={{ 
                minWidth: '130px', 
                marginRight: '10px', 
                fontWeight: 'bold',
                fontSize: '12px',
                color: '#000'
              }}>
                Perda Pot. Ativa:
              </label>
              <span style={{
                width: '200px',
                padding: '6px 8px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#666'
              }}>
                {lineResult.p_loss_mw.toFixed(2)}
              </span>
              <span style={{ 
                marginLeft: '8px', 
                fontSize: '12px', 
                color: '#666',
                minWidth: '50px'
              }}>
                MW
              </span>
            </div>

            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <label style={{ 
                minWidth: '130px', 
                marginRight: '10px', 
                fontWeight: 'bold',
                fontSize: '12px',
                color: '#000'
              }}>
                Perda Pot. Reativa:
              </label>
              <span style={{
                width: '200px',
                padding: '6px 8px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#666'
              }}>
                {lineResult.q_loss_mvar.toFixed(2)}
              </span>
              <span style={{ 
                marginLeft: '8px', 
                fontSize: '12px', 
                color: '#666',
                minWidth: '50px'
              }}>
                MVAr
              </span>
            </div>

            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <label style={{ 
                minWidth: '130px', 
                marginRight: '10px', 
                fontWeight: 'bold',
                fontSize: '12px',
                color: '#000'
              }}>
                % de uso:
              </label>
              <span style={{
                width: '200px',
                padding: '6px 8px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#666'
              }}>
                {lineResult.loading_percent.toFixed(1)}
              </span>
              <span style={{ 
                marginLeft: '8px', 
                fontSize: '12px', 
                color: '#666',
                minWidth: '50px'
              }}>
                %
              </span>
            </div>
          </>
        ) : (
          // Visualização de Edição
          <>
        {/* Campo baseMVA - somente leitura */}
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
          <label style={{ 
            minWidth: '130px', 
            marginRight: '10px', 
            fontWeight: 'bold',
            fontSize: '12px',
            color: '#000'
          }}>
            Base MVA:
          </label>
          <span style={{
            width: '200px',
            padding: '6px 8px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#666'
          }}>
            {data.baseMVA || 100}
          </span>
          <span style={{ 
            marginLeft: '8px', 
            fontSize: '12px', 
            color: '#666',
            minWidth: '50px'
          }}>
            MVA
          </span>
        </div>

        {renderField('Resistência (R)', 'r', 'pu')}
        {renderField('Reatância (X)', 'x', 'pu')}
        {renderField('Susceptância (B)', 'b', 'pu')}
        {renderField('Capacidade A', 'rateA', 'MVA')}
        {renderField('Capacidade B', 'rateB', 'MVA')}
        {renderField('Capacidade C', 'rateC', 'MVA')}
        {renderField('Tap (ratio)', 'ratio', 'pu', 0.8, 1.2, 0.001)}
        {renderField('Defasagem (angle)', 'angle', '°', -30, 30, 0.1)}
          </>
        )}
      </div>
    </EditModalBase>
  );
};
