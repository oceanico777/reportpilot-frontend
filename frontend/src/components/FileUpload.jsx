import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const FileUpload = ({ onUploadSuccess }) => {
    const { session } = useAuth();
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const inputRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const validateFile = (file) => {
        // Extended types to include jfif which maps to image/jpeg usually but validTypes check is stricter
        const validTypes = ['text/csv', 'application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/jfif'];
        if (!validTypes.includes(file.type) &&
            !file.name.toLowerCase().endsWith('.csv') &&
            !file.name.toLowerCase().endsWith('.pdf') &&
            !file.name.toLowerCase().endsWith('.jpg') &&
            !file.name.toLowerCase().endsWith('.jpeg') &&
            !file.name.toLowerCase().endsWith('.png') &&
            !file.name.toLowerCase().endsWith('.jfif')) {
            setError('Invalid file type. Please upload a CSV, PDF, JPG, PNG, or JFIF file.');
            return false;
        }
        return true;
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (selectedFile) => {
        setError('');
        setSuccess(false);
        setFile(null);

        if (!validateFile(selectedFile)) {
            return;
        }

        setFile(selectedFile);
        uploadFile(selectedFile);
    };

    const [progress, setProgress] = useState(0);

    const simulateProgress = () => {
        setProgress(0);
        let current = 0;
        const interval = setInterval(() => {
            current += Math.random() * 20; // Random jump 0-20%
            if (current > 90) {
                current = 90; // Cap at 90 until real finish
                clearInterval(interval);
            }
            setProgress(Math.round(current));
        }, 200); // Update every 200ms
        return interval;
    };

    const uploadFile = async (fileToUpload) => {
        setUploading(true);
        const progressInterval = simulateProgress();

        const formData = new FormData();
        formData.append("file", fileToUpload);

        try {
            // 1. Initiate Upload (Async)
            const headers = {};
            if (session?.access_token) {
                headers["Authorization"] = `Bearer ${session.access_token}`;
            }

            const response = await fetch(`${API_URL}/receipts/upload`, {
                method: "POST",
                headers: headers,
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server Error (${response.status}): ${errorText}`);
            }

            const initialData = await response.json();
            console.log("Upload initiated:", initialData);

            // If we get here, upload meant 100% sent to server
            // But we might be strictly processing. 95% is honest.
            setProgress(95);

            if (initialData.status === 'PROCESSING' || initialData.status === 'PENDING') {
                // 2. Poll for results
                await pollForCompletion(initialData.id, progressInterval);
            } else {
                clearInterval(progressInterval);
                setProgress(100);
                // Tiny delay to show 100% before switching view
                setTimeout(() => {
                    setSuccess(true);
                    if (onUploadSuccess) {
                        onUploadSuccess(initialData.file_path, initialData.extracted_data);
                    }
                    setUploading(false);
                }, 400);
            }

        } catch (err) {
            clearInterval(progressInterval);
            console.error("Upload error detail:", err);
            setError(err.message || "Failed to upload file.");
            setFile(null);
            setUploading(false);
        }
    };

    const pollForCompletion = async (receiptId, progressInterval) => {
        const pollInterval = 2000; // 2 seconds
        const maxAttempts = 60; // 120 seconds timeout (increased for stability)
        let attempts = 0;

        const checkStatus = async () => {
            try {
                const headers = {};
                if (session?.access_token) {
                    headers["Authorization"] = `Bearer ${session.access_token}`;
                }

                const pollUrl = `${API_URL}/receipts/${receiptId}`;
                console.log(`Polling URL: ${pollUrl}`);

                const res = await fetch(pollUrl, {
                    headers: headers
                });

                if (!res.ok) throw new Error("Polling failed");

                const receipt = await res.json();
                console.log("Polling status:", receipt.status);

                if (receipt.status === 'COMPLETED' || receipt.status === 'PROCESSED') {
                    clearInterval(progressInterval);
                    setProgress(100);
                    setTimeout(() => {
                        setSuccess(true);
                        setUploading(false);
                        if (onUploadSuccess) {
                            onUploadSuccess(receipt.storage_path, receipt.parsed_data);
                        }
                    }, 400);
                    return;
                }

                if (receipt.status === 'FAILED') {
                    throw new Error("OCR Processing failed on server.");
                }

                if (attempts >= maxAttempts) {
                    throw new Error("Processing timed out.");
                }

                attempts++;
                setTimeout(checkStatus, pollInterval);

            } catch (err) {
                clearInterval(progressInterval);
                console.error("Polling error:", err);
                // Alert the user to the exact error to help debugging
                // alert(`Polling Error: ${err.message}\nURL: ${API_URL}/receipts/${receiptId}`);
                setError(err.message || "Error processing file.");
                setUploading(false);
                setFile(null);
            }
        };

        // Start polling
        setTimeout(checkStatus, 1000);
    };

    const onButtonClick = () => {
        inputRef.current.click();
    };

    const removeFile = (e) => {
        e.stopPropagation();
        setFile(null);
        setSuccess(false);
        setError('');
        if (onUploadSuccess) {
            onUploadSuccess(null);
        }
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className="file-upload-container">
            <input
                ref={inputRef}
                type="file"
                className="input-file-hidden"
                multiple={false}
                onChange={handleChange}
                accept=".csv,.pdf,.jpg,.jpeg,.png,image/jpeg,image/png,text/csv,application/pdf"
                style={{ display: 'none' }}
            />

            <div
                className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
                style={{
                    border: `2px dashed ${dragActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: dragActive ? 'rgba(var(--color-primary-rgb), 0.1)' : 'var(--color-bg-card)',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                }}
            >
                {uploading ? (
                    <div className="upload-status">
                        <p>Uploading {file?.name}...</p>
                        <div className="progress-bar" style={{
                            width: '100%',
                            height: '6px',
                            background: 'rgba(255,255,255,0.1)',
                            marginTop: '12px',
                            borderRadius: '3px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${progress}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                                transition: 'width 0.2s ease-out'
                            }}></div>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                            {progress < 100 ? 'Subiendo y Analizando...' : '¡Listo!'}
                        </p>
                    </div>
                ) : success ? (
                    <div className="upload-success" style={{ color: 'var(--color-success)' }}>
                        <p>✅ {file?.name}</p>
                        <button
                            onClick={removeFile}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-text-muted)',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                marginTop: '0.5rem'
                            }}
                        >
                            Remove / Replace
                        </button>
                    </div>
                ) : (
                    <div className="upload-prompt">
                        <p style={{ marginBottom: '0.5rem', fontWeight: '500' }}>
                            Drag & Drop your file here
                        </p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                            or click to browse
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '1rem' }}>
                            Supported formats: CSV, PDF, JPG, PNG
                        </p>
                    </div>
                )}

                {error && (
                    <div className="upload-error" style={{
                        color: 'var(--color-danger)',
                        marginTop: '1rem',
                        fontSize: '0.9rem'
                    }}>
                        ⚠️ {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUpload;
