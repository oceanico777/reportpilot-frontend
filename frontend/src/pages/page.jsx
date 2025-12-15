"use client";
import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { RefreshCw, UploadCloud, FileText, Loader, ArrowRight, XCircle, Info, CheckCircle } from 'lucide-react';

// URL del Backend de Render
const BACKEND_URL = "https://reportpilot-backend.onrender.com";

// El componente principal
export default function App() {
  const [file, setFile] = useState(null);
  const [imageBase64, setImageBase64] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companyId, setCompanyId] = useState('demo-company-123');
  const [period, setPeriod] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [year, setYear] = useState(new Date().getFullYear().toString());

  // Mapeo de meses para el selector
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString('default', { month: 'long' })
  );
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  const fileInputRef = useRef(null);

  // Función que maneja la subida del archivo (arrastrar o hacer clic)
  const onDrop = useCallback(acceptedFiles => {
    setError('');
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);

      const reader = new FileReader();
      reader.onload = (event) => {
        // Extraer solo la parte base64 (después de la coma)
        const base64String = event.target.result.split(',')[1];
        setImageBase64(base64String);
      };
      reader.onerror = () => {
        setError("Error al leer el archivo.");
      };
      reader.readAsDataURL(uploadedFile);
    }
  }, []);

  // Configuración para react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.pdf'] },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  // Función para construir el prompt que se envía a Gemini
  const buildPrompt = () => {
    const analysisInstructions = "Analiza la imagen adjunta, que es un recibo, una factura o un documento financiero. Extrae la siguiente información: Nombre del emisor/tienda, Fecha de la transacción, Subtotal (antes de impuestos), Monto del Impuesto (IVA/ITBMS), Monto Total. Si puedes, genera una tabla Markdown con esta información.";
    const context = `Contexto del reporte: Empresa ${companyId}, Período ${period}, Año ${year}.`;
    return `${analysisInstructions}\n\n${context}`;
  };

  // Función que llama al Backend (Render)
  const handleGenerateReport = async () => {
    if (!imageBase64) {
      setError("Por favor, sube un archivo (imagen o PDF) antes de generar el reporte.");
      return;
    }

    setLoading(true);
    setAnalysisResult('');
    setError('');

    try {
      const response = await fetch(`${BACKEND_URL}/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: imageBase64,
          prompt: buildPrompt(),
        }),
      });

      if (!response.ok) {
        // Intenta leer el detalle del error del servidor
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error del servidor: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setAnalysisResult(data.result || 'No se pudo obtener el resultado del análisis.');

    } catch (err) {
      console.error("Error en la solicitud al backend:", err);
      setError(`Error al conectar o procesar: ${err.message}. Revisa el log de Render por errores de CORS o API Key.`);
    } finally {
      setLoading(false);
    }
  };

  // Función para resetear el formulario
  const handleReset = () => {
    setFile(null);
    setImageBase64('');
    setAnalysisResult('');
    setError('');
    setLoading(false);
  };

  // Componente UploadArea
  const UploadArea = ({ file, getRootProps, getInputProps, isDragActive, isLoading }) => {
    const idleText = isDragActive
      ? "Suelta el archivo aquí..."
      : "Arrastra y suelta tu recibo (JPG/PNG), o haz click para buscar.";

    return (
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors 
          ${isDragActive ? 'border-indigo-400 bg-indigo-900/20' : 'border-gray-600 hover:border-indigo-500'}
          ${isLoading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="text-white flex flex-col items-center">
            <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
            <p className="font-semibold text-lg">{file.name}</p>
            <p className="text-sm text-gray-400">Listo para generar el reporte.</p>
          </div>
        ) : (
          <div className="text-gray-400 flex flex-col items-center">
            <FileText className="w-8 h-8 mb-2" />
            <p className="font-medium text-white">{idleText}</p>
            <p className="text-sm">(Solo se aceptan archivos JPG/PNG de recibos)</p>
          </div>
        )}
      </div>
    );
  };

  // Función para renderizar el resultado (Markdown)
  const renderResult = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => {
      // Simple renderizado de Markdown (para tablas y negritas)
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.split('|').filter(c => c.trim() !== '');
        if (cells.length > 0) {
          return (
            <div key={index} className="flex border-b border-gray-700 py-1">
              {cells.map((cell, i) => (
                <div key={i} className={`p-2 ${index === 0 ? 'font-bold bg-gray-700' : ''} flex-1`}>
                  {cell.trim()}
                </div>
              ))}
            </div>
          );
        }
      }
      return <p key={index} className="text-gray-200 mt-2">{line.replace(/\*\*/g, '• ')}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col lg:flex-row">
      {/* Sidebar - Componente de Navegación */}
      <div className="bg-gray-800 w-full lg:w-64 p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-8 text-blue-400">ReportPilot</h1>
          <nav>
            <div className="flex items-center p-3 rounded-lg bg-blue-600 text-white mb-2 shadow-lg">
              <FileText className="w-5 h-5 mr-3" />
              <span>Nuevo Reporte</span>
            </div>
            <div className="flex items-center p-3 rounded-lg text-gray-400 hover:bg-gray-700 cursor-pointer mb-2">
              <RefreshCw className="w-5 h-5 mr-3" />
              <span>Historial</span>
            </div>
          </nav>
        </div>
        <div className="text-sm text-gray-500">
          <p>Hecho con Gemini 2.5 Flash</p>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10">
        <h2 className="text-3xl font-semibold mb-6">Generar Nuevo Reporte</h2>

        {/* Alertas */}
        {error && (
          <div className="flex items-center bg-red-800 p-4 rounded-lg mb-6 shadow-md">
            <XCircle className="w-6 h-6 mr-3 text-red-300" />
            <span className="text-red-100 font-medium">Error: {error}</span>
          </div>
        )}

        {/* Formulario e Input */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Columna de Input (Formulario y Subida) */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl">
            <h3 className="text-xl font-medium mb-4 text-blue-300">Detalles del Archivo</h3>

            {/* Campos de Contexto */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Company ID</label>
                <input
                  type="text"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Período</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Año</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Área de Subida de Archivo (Dropzone) */}
            <div
              {...getRootProps()}
              className={`p-10 border-2 border-dashed rounded-lg text-center transition duration-200 cursor-pointer 
                ${isDragActive ? 'border-blue-500 bg-gray-700' : 'border-gray-600 hover:border-blue-500 hover:bg-gray-700'}`}
            >
              <input {...getInputProps()} ref={fileInputRef} />
              <UploadCloud className="w-10 h-10 mx-auto text-blue-400 mb-3" />
              {file ? (
                <p className="text-blue-200 font-semibold">{file.name} (Listo para analizar)</p>
              ) : (
                <p className="text-gray-400">Arrastra y suelta tu recibo (JPG, PNG, PDF) aquí, o haz clic para buscar.</p>
              )}
            </div>

            {/* Botón de Acción y Reset */}
            <div className="mt-6 flex space-x-4">
              <button
                onClick={handleGenerateReport}
                disabled={loading || !file}
                className={`flex-1 flex items-center justify-center p-3 rounded-lg font-bold transition duration-200 
                  ${loading || !file ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg'}`}
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 mr-3 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    Generar Reporte <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                disabled={loading}
                className="p-3 rounded-lg text-gray-400 border border-gray-600 hover:bg-gray-700 transition duration-200"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Columna de Output (Resultado del Análisis) */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl">
            <h3 className="text-xl font-medium mb-4 text-blue-300">Resultado del Análisis de IA</h3>

            <div className="h-96 overflow-y-auto bg-gray-700 p-4 rounded-lg border border-gray-600">
              {loading && (
                <div className="flex flex-col items-center justify-center h-full text-blue-400">
                  <Loader className="w-8 h-8 animate-spin mb-3" />
                  <p>Esperando el análisis de Gemini...</p>
                </div>
              )}

              {error && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-red-400">
                  <XCircle className="w-8 h-8 mb-3" />
                  <p className='text-center'>Hubo un error. Revisa la consola para más detalles.</p>
                </div>
              )}

              {!loading && !analysisResult && !error && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Info className="w-8 h-8 mb-3" />
                  <p>Sube y analiza un recibo para ver el reporte.</p>
                </div>
              )}

              {!loading && analysisResult && renderResult(analysisResult)}

            </div>
          </div>
        </div>

        <div className="mt-10 p-4 bg-gray-800 rounded-lg text-sm text-gray-400">
          <p className="font-semibold text-blue-300">Nota importante:</p>
          <p>La URL del backend es: <code className="bg-gray-700 p-1 rounded">https://reportpilot-backend.onrender.com</code>. Si el análisis falla, verifica la clave <code className="bg-gray-700 p-1 rounded">GEMINI_API_KEY</code> en Render y las reglas de <code className="bg-gray-700 p-1 rounded">CORS</code> en el código del Backend.</p>
        </div>
      </main>
    </div>
  );
}
