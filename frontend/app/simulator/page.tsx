"use client";
import { useState } from "react";
import styles from "./styles.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Footer from "./components/Footer";
import MessageModal from "./components/MessageModal";

export default function Simulator() {
  const [selectedFile, setSelectedFile] = useState("");
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleSimulation = () => {
    if (!selectedFile) {
      setShowModal(true);
      return;
    }

    if (selectedFile === "numeric") {
      router.push("/simulator/numeric");
      return;
    }

    router.push(`/simulator/system?system=${selectedFile}`);
  };

  return (
    <div className={styles.container}>
      <Image
        src="/transmission-lines.jpg"
        alt="Transmission Lines Background"
        fill
        priority
        className={styles.backgroundImage}
      />
      <div className={styles.overlay} />
      
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Image
            src="/univali-logo.png"
            alt="UNIVALI Logo"
            width={80}
            height={80}
            className={styles.logo}
          />
          <h1 className={styles.headerTitle}>Simulador Interativo de Sistemas Elétricos de Potência - SISEP</h1>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.formContainer}>
          <div className={styles.selectContainer}>
            <select
              className={styles.select}
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
            >
              <option value="">Selecione um modelo do sistema</option>
              <option value="case3p.m">Sistema de 3 Barras</option>
              <option value="case4p.m">Sistema de 4 Barras</option>
              <option value="case5p.m">Sistema de 5 Barras</option>
              <option value="case6p.m">Sistema de 6 Barras</option>
              <option value="case9p.m">Sistema de 9 Barras</option>
              <option value="case14p.m">Sistema de 14 Barras</option>
              <option value="numeric">Modelo com entrada/saída numérica</option>
            </select>
          </div>
          <div className={styles.buttonContainer}>
            <button
              className={styles.simulateButton}
              onClick={handleSimulation}
              disabled={!selectedFile}
            >
              SIMULAR
            </button>
          </div>
        </div>
      </main>

      <Footer />

      <MessageModal
        show={showModal}
        title="Seleção Obrigatória"
        message="Por favor selecione um modelo para simular"
        buttons={[
          {
            label: 'OK',
            onClick: () => setShowModal(false),
            variant: 'primary'
          }
        ]}
      />
    </div>
  );
}