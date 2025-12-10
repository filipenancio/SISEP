"use client";
import styles from "../styles.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Footer from "../components/Footer";
import MessageModal from "../components/MessageModal";
import HeaderChild from "../components/HeaderChild";
import { formatResults } from "../utils/FormattedOutput";
import { formatInput } from "../utils/FormattedInput";
import { useState, useRef } from "react";

// Componente da view de entrada
const InputView = ({ 
  inputValue, 
  setInputValue, 
  handleBackToMain, 
  handleSubmit, 
  isLoading,
  selectedAlgorithm,
  setSelectedAlgorithm
}: {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleBackToMain: () => void;
  handleSubmit: () => void;
  isLoading: boolean;
  selectedAlgorithm: string;
  setSelectedAlgorithm: (value: string) => void;
}) => (
  <div className={styles.contentContainer}>
    <div className={styles.singleSection}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Entrada</h2>
        <textarea
          className={styles.textArea}
          placeholder={`Digite o modelo no formato MATPOWER...

function mpc = caseXXX
    mpc.version = '2';
    mpc.baseMVA = 100;
    mpc.bus = [ ... ];
    mpc.gen = [ ... ];
    mpc.branch = [ ... ];
end`}
          spellCheck={false}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>
      <div style={{ 
        marginTop: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap',
          flex: 1
        }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#495057', marginRight: '8px' }}>
            Algoritmo:
          </span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input 
              type="radio" 
              value="nr" 
              checked={selectedAlgorithm === 'nr'}
              onChange={(e) => setSelectedAlgorithm(e.target.value)}
              style={{ cursor: 'pointer', width: '14px', height: '14px' }}
            />
            <span style={{ fontSize: '11px', color: '#333', whiteSpace: 'nowrap' }}>Newton-Raphson (nr)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input 
              type="radio" 
              value="fdxb" 
              checked={selectedAlgorithm === 'fdxb'}
              onChange={(e) => setSelectedAlgorithm(e.target.value)}
              style={{ cursor: 'pointer', width: '14px', height: '14px' }}
            />
            <span style={{ fontSize: '11px', color: '#333', whiteSpace: 'nowrap' }}>NR desacoplado (fdxb)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input 
              type="radio" 
              value="fdbx" 
              checked={selectedAlgorithm === 'fdbx'}
              onChange={(e) => setSelectedAlgorithm(e.target.value)}
              style={{ cursor: 'pointer', width: '14px', height: '14px' }}
            />
            <span style={{ fontSize: '11px', color: '#333', whiteSpace: 'nowrap' }}>NR desacoplado (fdbx)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input 
              type="radio" 
              value="bfsw" 
              checked={selectedAlgorithm === 'bfsw'}
              onChange={(e) => setSelectedAlgorithm(e.target.value)}
              style={{ cursor: 'pointer', width: '14px', height: '14px' }}
            />
            <span style={{ fontSize: '11px', color: '#333', whiteSpace: 'nowrap' }}>BF Sweep (bfsw)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input 
              type="radio" 
              value="gs" 
              checked={selectedAlgorithm === 'gs'}
              onChange={(e) => setSelectedAlgorithm(e.target.value)}
              style={{ cursor: 'pointer', width: '14px', height: '14px' }}
            />
            <span style={{ fontSize: '11px', color: '#333', whiteSpace: 'nowrap' }}>Gauss-Seidel (gs)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input 
              type="radio" 
              value="dc" 
              checked={selectedAlgorithm === 'dc'}
              onChange={(e) => setSelectedAlgorithm(e.target.value)}
              style={{ cursor: 'pointer', width: '14px', height: '14px' }}
            />
            <span style={{ fontSize: '11px', color: '#333', whiteSpace: 'nowrap' }}>DC Power Flow (dc)</span>
          </label>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button 
            className={styles.backButton} 
            onClick={handleBackToMain}
          >
            VOLTAR
          </button>
          <button
            className={styles.simulateButton}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "SIMULANDO..." : "SIMULAR"}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Componente da view de saída
const OutputView = ({ 
  output, 
  handleBackToInput, 
  generatePDF 
}: {
  output: string;
  handleBackToInput: () => void;
  generatePDF: () => void;
}) => (
  <div className={styles.contentContainer}>
    <div className={styles.singleSection}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Saída</h2>
        <textarea
          className={styles.outputArea}
          value={output}
          readOnly
          spellCheck={false}
        />
      </div>
      <div className={styles.actions}>
        <button 
          className={styles.backButton} 
          onClick={handleBackToInput}
        >
          VOLTAR
        </button>
        <button
          className={styles.exportButton}
          onClick={generatePDF}
        >
          EXPORTAR
        </button>
      </div>
    </div>
  </div>
);

export default function NumericModel() {
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('nr'); // Newton-Raphson por padrão
  const [currentView, setCurrentView] = useState<'input' | 'output'>('input');
  const [errorModal, setErrorModal] = useState({ show: false, title: '', message: '' });
  const router = useRouter();

  const validateMatpowerFormat = (text: string): boolean => {
    if (!text || text.trim() === "") {
      return false;
    }

    // Verifica se contém as três matrizes obrigatórias do MATPOWER
    const hasMpcBase= /mpc\.baseMVA\s*=/.test(text);
    const hasMpcBus = /mpc\.bus\s*=/.test(text);
    const hasMpcGen = /mpc\.gen\s*=/.test(text);
    const hasMpcBranch = /mpc\.branch\s*=/.test(text);

    return hasMpcBase && hasMpcBus && hasMpcGen && hasMpcBranch;
  };

  const handleSubmit = async () => {
    const currentInput = inputValue;
    
    if (!currentInput || currentInput.trim() === "") {
      setErrorModal({
        show: true,
        title: 'Entrada Inválida',
        message: 'A entrada fornecida é inválida! Verifique os dados inseridos!\n\nObs.: Utilize sintaxe similar a do MATPOWER.'
      });
      return;
    }

    if (!validateMatpowerFormat(currentInput)) {
      setErrorModal({
        show: true,
        title: 'Formato Inválido',
        message: 'A entrada fornecida é inválida! Verifique os dados inseridos!\n\nObs.: Utilize sintaxe similar a do MATPOWER.'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Criar o arquivo .m com o conteúdo
      const formData = new FormData();
      const file = new File([currentInput], "file.m", { type: "text/plain" });
      formData.append("file", file);

      // Enviar para o backend com o algoritmo selecionado
      const response = await fetch(`http://localhost:8000/sisep/simulate/matpower/upload?algorithm=${selectedAlgorithm}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro na simulação");
      }

      const result = await response.json();
      
      // Formatar os resultados antes de exibir
      const formattedResult = formatResults(result);
      setOutput(formattedResult);
      
      // Mudar para a view de output
      setCurrentView('output');
    } catch (error) {
      console.error("Erro na simulação:", error);
      setErrorModal({
        show: true,
        title: 'Erro na Simulação',
        message: 'Erro ao executar a simulação. Verifique os dados de entrada e tente novamente.'
      });
      setOutput("Erro ao executar a simulação");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToInput = () => {
    setCurrentView('input');
    setOutput("");
  };

  const handleBackToMain = () => {
    router.push("/simulator");
  };

  const generatePDF = async () => {
    try {
      // Importar jsPDF dinamicamente
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default || jsPDFModule;
      
      // Verificar se jsPDF foi importado corretamente
      if (!jsPDF) {
        throw new Error('Falha ao carregar biblioteca jsPDF');
      }
      
      // Usar orientação retrato (portrait) com página A4 e margem 20
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20; // Margem conforme solicitado
      const lineHeight = 5; // Espaçamento adequado para fonte 12
      const maxLineWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Função para quebrar texto respeitando a largura máxima
      const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
        doc.setFontSize(fontSize);
        
        if (!text || text.trim() === '') {
          return [''];
        }
        
        const lines: string[] = [];
        let currentLine = '';
        
        // Quebrar caractere por caractere para maior precisão
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const testLine = currentLine + char;
          
          // Verificar se a linha teste cabe na largura máxima
          if (doc.getTextWidth(testLine) <= maxWidth) {
            currentLine = testLine;
          } else {
            // Se não cabe, adicionar a linha atual e começar nova linha
            if (currentLine.length > 0) {
              lines.push(currentLine);
              currentLine = char;
            } else {
              // Se nem um caractere cabe, forçar adição
              lines.push(char);
              currentLine = '';
            }
          }
        }
        
        // Adicionar última linha se houver conteúdo
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }
        
        return lines.length > 0 ? lines : [''];
      };

      // Função para verificar se precisa de nova página
      const checkNewPage = (linesToAdd: number = 1) => {
        if (yPosition + (lineHeight * linesToAdd) > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Título do relatório
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Simulação - SISEP", pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lineHeight * 2;

      // Data e hora
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      const currentDate = new Date().toLocaleString('pt-BR');
      doc.text(`Gerado em: ${currentDate}`, margin, yPosition);
      yPosition += lineHeight * 2;

      // Seção de entrada
      checkNewPage(3);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Entrada (Código MATPOWER):", margin, yPosition);
      yPosition += lineHeight * 1.5;

      // Formatar entrada usando FormattedInput
      doc.setFontSize(8);
      doc.setFont("courier", "normal");
      const formattedInputText = formatInput(inputValue);
      const inputLines = formattedInputText.split('\n');
      
      for (const originalLine of inputLines) {
        // Quebrar cada linha original em linhas que cabem na página
        const wrappedLines = wrapText(originalLine, maxLineWidth, 8);
        
        for (const wrappedLine of wrappedLines) {
          checkNewPage();
          doc.text(wrappedLine, margin, yPosition);
          yPosition += lineHeight;
        }
      }

      yPosition += lineHeight;

      // Seção de saída
      checkNewPage(3);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Resultados da Simulação:", margin, yPosition);
      yPosition += lineHeight * 1.5;

      // Processar saída com fonte 9
      doc.setFontSize(9);
      doc.setFont("courier", "normal");
      const outputLines = output.split('\n');
      
      for (const originalLine of outputLines) {
        if (originalLine.trim() === '') {
          // Linha vazia - apenas avançar
          yPosition += lineHeight * 0.5;
          continue;
        }
      
        checkNewPage();
        doc.text(originalLine, margin, yPosition);
        yPosition += lineHeight;
      }

      // Salvar o PDF
      doc.save(`relatorio-sisep-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setErrorModal({
        show: true,
        title: 'Erro ao Gerar PDF',
        message: `Erro ao gerar o relatório PDF: ${errorMessage}\n\nVerifique o console para mais detalhes.`
      });
    }
  };

  return (
    <div className={`${styles.container} ${styles.numericPage}`}>
      <Image
        src="/transmission-lines.jpg"
        alt="Transmission Lines Background"
        fill
        priority
        className={styles.backgroundImage}
      />
      <div className={styles.overlay} />

      <HeaderChild title="Modelo Numérico - SISEP" logoSize={60} />

      <main className={styles.mainContent}>
        {currentView === 'input' ? (
          <InputView 
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleBackToMain={handleBackToMain}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            selectedAlgorithm={selectedAlgorithm}
            setSelectedAlgorithm={setSelectedAlgorithm}
          />
        ) : (
          <OutputView 
            output={output}
            handleBackToInput={handleBackToInput}
            generatePDF={generatePDF}
          />
        )}
      </main>

      <Footer />

      <MessageModal
        show={errorModal.show}
        title={errorModal.title}
        message={errorModal.message}
        buttons={[
          {
            label: 'OK',
            onClick: () => setErrorModal({ show: false, title: '', message: '' }),
            variant: 'primary'
          }
        ]}
      />
    </div>
  );
}