import React from 'react';
import { EditModalBase } from './EditModalBase';
import { NumericInput } from './NumericInput';

export interface Bus {
  bus_i: number;
  type: number;
  Pd: number;
  Qd: number;
  Gs: number;
  Bs: number;
  area: number;
  Vm: number;
  Va: number;
  baseKV: number;
  zone: number;
  Vmax: number;
  Vmin: number;
  hasGenerator?: boolean;
}

interface BusResultData {
  bus_id: number;
  vm_pu: number;
  va_degree: number;
  p_mw: number;
  q_mvar: number;
}

interface EditModalBusProps {
  show: boolean;
  data: Bus | null;
  busResult?: BusResultData;
  onClose: () => void;
  onSave?: () => void;
  onRestore?: () => void;
  onChange?: (newData: Bus) => void;
  viewOnly?: boolean;
}

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => {
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: '50px',
        height: '25px',
        borderRadius: '25px',
        backgroundColor: checked ? '#007AFF' : '#E5E5E5',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.3s ease',
        opacity: disabled ? 0.6 : 1
      }}
    >
      <div
        style={{
          width: '21px',
          height: '21px',
          borderRadius: '50%',
          backgroundColor: 'white',
          position: 'absolute',
          top: '2px',
          left: checked ? '27px' : '2px',
          transition: 'left 0.3s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />
    </div>
  );
};

export const EditModalBus: React.FC<EditModalBusProps> = ({
  show,
  data,
  busResult,
  onClose,
  onSave,
  onRestore,
  onChange,
  viewOnly = false
}) => {
  if (!data) return null;

  const isResultView = viewOnly && busResult;

  const busTypeNames: { [key: number]: string } = {
    1: 'PQ (Carga)',
    2: 'PV (Gerador)',
    3: 'Slack (Referência)'
  };

  const renderField = (label: string, key: keyof Bus, unit: string, min?: number, max?: number, step?: number) => (
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
      title={`Edição de Barra (Barra ${data.bus_i})`}
      onClose={onClose}
      onSave={onSave}
      onRestore={onRestore}
      viewOnly={viewOnly}
    >
      <div>
        {/* Campo do tipo de barra - somente leitura */}
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
          <label style={{ 
            minWidth: '130px', 
            marginRight: '10px', 
            fontWeight: 'bold',
            fontSize: '12px',
            color: '#000'
          }}>
            Tipo:
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
            {busTypeNames[data.type] || 'Desconhecido'}
          </span>
          <span style={{ 
            marginLeft: '8px', 
            fontSize: '12px', 
            color: '#666',
            minWidth: '50px'
          }}>
            {/* Espaço para unidade */}
          </span>
        </div>

        {/* Campo baseKV - somente leitura */}
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
          <label style={{ 
            minWidth: '130px', 
            marginRight: '10px', 
            fontWeight: 'bold',
            fontSize: '12px',
            color: '#000'
          }}>
            Base kV:
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
            {data.baseKV || 230}
          </span>
          <span style={{ 
            marginLeft: '8px', 
            fontSize: '12px', 
            color: '#666',
            minWidth: '50px'
          }}>
            kV
          </span>
        </div>

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
                V:
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
                {busResult.vm_pu.toFixed(3)}
              </span>
              <span style={{ 
                marginLeft: '8px', 
                fontSize: '12px', 
                color: '#666',
                minWidth: '50px'
              }}>
                pu
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
                θ:
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
                {busResult.va_degree.toFixed(2)}
              </span>
              <span style={{ 
                marginLeft: '8px', 
                fontSize: '12px', 
                color: '#666',
                minWidth: '50px'
              }}>
                °
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
                P:
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
                {busResult.p_mw.toFixed(2)}
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
                Q:
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
                {busResult.q_mvar.toFixed(2)}
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
          </>
        ) : (
          // Visualização de Edição
          <>
        {/* Campos de demanda */}
        {renderField('Potência Ativa', 'Pd', 'MW', 0)}
        {renderField('Potência Reativa', 'Qd', 'MVAr', 0)}
        
        {/* Campos de tensão e ângulo - somente leitura */}
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
          <label style={{ 
            minWidth: '130px', 
            marginRight: '10px', 
            fontWeight: 'bold',
            fontSize: '12px',
            color: '#000'
          }}>
            Tensão:
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
            {data.Vm !== undefined ? data.Vm.toFixed(3) : '1.000'}
          </span>
          <span style={{ 
            marginLeft: '8px', 
            fontSize: '12px', 
            color: '#666',
            minWidth: '50px'
          }}>
            pu
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
            Ângulo:
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
            {data.Va !== undefined ? data.Va.toFixed(2) : '0.00'}
          </span>
          <span style={{ 
            marginLeft: '8px', 
            fontSize: '12px', 
            color: '#666',
            minWidth: '50px'
          }}>
            °
          </span>
        </div>

        {renderField('V máxima', 'Vmax', 'pu', 0.8, 1.2, 0.01)}
        {renderField('V mínima', 'Vmin', 'pu', 0.8, 1.2, 0.01)}
        
        {/* Campo Bs - Shunt da Barra */}
        {renderField('Shunt da Barra (Bs)', 'Bs', 'MVAr', undefined, undefined, 0.001)}
        
        {/* Campo do gerador - movido para o final */}
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
          <label style={{ 
            minWidth: '130px', 
            marginRight: '10px', 
            fontWeight: 'bold',
            fontSize: '12px',
            color: '#000'
          }}>
            Gerador:
          </label>
          <div style={{ width: '200px', display: 'flex', alignItems: 'center' }}>
            <ToggleSwitch
              checked={data.hasGenerator || false}
              onChange={viewOnly ? () => {} : (checked: boolean) => onChange?.({ ...data, hasGenerator: checked })}
              disabled={viewOnly || data.type === 3} // Barra slack sempre tem gerador
            />
            <span style={{ 
              marginLeft: '8px', 
              fontSize: '12px', 
              color: data.type === 3 ? '#999' : '#666'
            }}>
              {data.hasGenerator ? 'Sim' : 'Não'}
            </span>
          </div>
          <span style={{ 
            marginLeft: '8px', 
            fontSize: '12px', 
            color: '#999',
            minWidth: '50px',
            fontStyle: 'italic'
          }}>
            {data.type === 3 ? '(obrig.)' : ''}
          </span>
        </div>
          </>
        )}
      </div>
    </EditModalBase>
  );
};
