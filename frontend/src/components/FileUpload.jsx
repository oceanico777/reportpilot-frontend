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

    const uploadFile = async (fileToUpload) => {
        setUploading(true);
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

            if (initialData.status === 'PROCESSING' || initialData.status === 'PENDING') {
                // 2. Poll for results
                await pollForCompletion(initialData.id);
            } else {
                setSuccess(true);
                if (onUploadSuccess) {
                    onUploadSuccess(initialData.file_path, initialData.extracted_data);
                }
                setUploading(false);
            }

        } catch (err) {
            console.error("Upload error detail:", err);
            setError(err.message || "Failed to upload file.");
            setFile(null);
            setUploading(false);
        }
    };

    const pollForCompletion = async (receiptId) => {
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
                    setSuccess(true);
                    setUploading(false);
                    if (onUploadSuccess) {
                        onUploadSuccess(receipt.storage_path, receipt.parsed_data);
                    }
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
                console.error("Polling error:", err);
                // Alert the user to the exact error to help debugging
                alert(`Polling Error: ${err.message}\nURL: ${API_URL}/receipts/${receiptId}`);
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
                            height: '4px',
                            background: 'var(--color-border)',
                            marginTop: '10px',
                            borderRadius: '2px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: '50%',
                                height: '100%',
                                background: 'var(--color-primary)',
                                animation: 'progress 1s infinite linear'
                            }}></div>
                        </div>
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
