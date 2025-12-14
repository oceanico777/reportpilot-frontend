import React, { useState, useRef } from 'react';

const FileUpload = ({ onUploadSuccess }) => {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const inputRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
        const validTypes = ['text/csv', 'application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type) &&
            !file.name.endsWith('.csv') &&
            !file.name.endsWith('.pdf') &&
            !file.name.endsWith('.jpg') &&
            !file.name.endsWith('.jpeg') &&
            !file.name.endsWith('.png')) {
            setError('Invalid file type. Please upload a CSV, PDF, JPG, or PNG file.');
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
            const response = await fetch(`${API_URL}/reports/upload`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            const data = await response.json();
            setSuccess(true);
            if (onUploadSuccess) {
                onUploadSuccess(data.file_path);
            }
        } catch (err) {
            console.error("Upload error:", err);
            setError("Failed to upload file. Please try again.");
            setFile(null);
        } finally {
            setUploading(false);
        }
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
