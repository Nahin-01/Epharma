import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { prescriptionsApi } from '../api/prescriptions.api';
import { useToast } from '../context/ToastContext';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const MAX_FILES = 5;

export default function UploadPrescription() {
  const toast = useToast();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const addFiles = (list) => {
    const incoming = Array.from(list).filter((f) => ACCEPTED_TYPES.includes(f.type));
    const rejected = list.length - incoming.length;
    if (rejected > 0) toast.error(`${rejected} file(s) skipped — only JPG, PNG, or PDF are supported.`);
    setFiles((prev) => [...prev, ...incoming].slice(0, MAX_FILES));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (files.length === 0) {
      setError('Please add at least one prescription file (JPG, PNG, or PDF, max 5MB each).');
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const prescription = await prescriptionsApi.upload(files, 'UPLOAD', setProgress);
      setResult(prescription);
      toast.success('Prescription uploaded successfully');
    } catch (err) {
      setError(err.message || 'Could not upload prescription');
    } finally {
      setUploading(false);
    }
  };

  if (result) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center py-12">
        <div className="card max-w-md p-8 text-center">
          <div className="mb-3 text-4xl">✅</div>
          <h1 className="mb-2 text-lg font-bold text-slate-800">Prescription uploaded successfully</h1>
          <p className="text-sm text-slate-500">
            Our pharmacy team will review your prescription and contact you if needed. You can track its status from
            My Prescriptions.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button type="button" className="btn-outline" onClick={() => navigate('/prescriptions')}>
              View my prescriptions
            </button>
            <button type="button" className="btn-primary" onClick={() => navigate('/products')}>
              Continue shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-1 text-xl font-bold text-slate-800">Upload Prescription</h1>
        <p className="mb-6 text-sm text-slate-500">
          Upload your prescription and get your medicine right at your doorstep.
        </p>

        <form onSubmit={handleSubmit}>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
              dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-white'
            }`}
          >
            <div className="mb-3 text-3xl">📤</div>
            <p className="text-sm font-medium text-slate-700">Drag & drop your prescription here</p>
            <p className="mt-1 text-xs text-slate-400">JPG, JPEG, or PNG, or PDF — max 5MB per file, up to {MAX_FILES} files</p>
            <button type="button" className="btn-outline mt-4" onClick={() => inputRef.current?.click()}>
              Choose file
            </button>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((file, idx) => (
                <li key={`${file.name}-${idx}`} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm">
                  <span className="truncate">{file.name}</span>
                  <button type="button" onClick={() => removeFile(idx)} className="text-xs text-red-600 hover:underline">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="field-error mt-3">{error}</p>}

          {uploading && (
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}

          <button type="submit" className="btn-primary mt-6 w-full" disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload prescription'}
          </button>
        </form>
      </div>
    </div>
  );
}
