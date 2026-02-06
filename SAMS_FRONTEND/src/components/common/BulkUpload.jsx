import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  HiOutlineUpload,
  HiOutlineDocumentDownload,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineExclamation,
  HiOutlineArrowDown,
} from "react-icons/hi";
import Button from "./Button";

/* ============================================================
   BulkUpload Component
   Redesigned bulk upload with progress, validation, and error reporting
   
   Usage:
   <BulkUpload
     endpoint="/api/admin/students/bulk"
     templateUrl="/templates/students.csv"
     fields={['fullname', 'email', 'roll_no', 'department_id']}
     onComplete={(result) => {}}
   />
============================================================ */

const BulkUpload = ({
  title = "Bulk Upload",
  endpoint,
  templateUrl,
  fields = [],
  onComplete,
  onError,
  acceptedFormats = [".csv", ".xlsx"],
  maxSize = 5 * 1024 * 1024, // 5MB
}) => {
  const [step, setStep] = useState("upload"); // upload, validating, review, processing, complete
  const [file, setFile] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState("");
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      validateFile(uploadedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "text/csv": [".csv"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
      },
      maxSize,
      multiple: false,
    });

  // Validate file before upload
  const validateFile = async (fileToValidate) => {
    setStep("validating");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", fileToValidate);
      formData.append("validate_only", "true");

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Validation failed");
      }

      setValidationResult(result.data);
      setStep("review");
    } catch (err) {
      setError(err.message);
      setStep("upload");
    }
  };

  // Process valid records
  const handleProcess = async () => {
    setStep("processing");
    setError(null);
    setProcessingProgress(0);
    setProcessingStatus("Initializing...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "valid_rows",
        JSON.stringify(validationResult.valid_rows),
      );

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      // Handle progress polling for large files
      if (response.ok) {
        // Simple response for small files
        const result = await response.json();
        setUploadResult(result.data);
        setProcessingProgress(100);
        setStep("complete");
        onComplete?.(result.data);
      } else {
        const result = await response.json();
        throw new Error(result.message || "Upload failed");
      }
    } catch (err) {
      setError(err.message);
      setStep("review");
      onError?.(err);
    }
  };

  // Download error report
  const downloadErrorReport = () => {
    if (!validationResult?.errors) return;

    const csvContent = convertErrorsToCSV(validationResult.errors);
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `error_report_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Convert errors to CSV
  const convertErrorsToCSV = (errors) => {
    const headers = ["row_number", "field", "value", "error"];
    const rows = errors.map(
      (e) => `${e.row_number},"${e.field}","${e.value || ""}","${e.error}"`,
    );
    return [headers.join(","), ...rows].join("\n");
  };

  // Reset and start over
  const handleReset = () => {
    setFile(null);
    setValidationResult(null);
    setUploadResult(null);
    setError(null);
    setProcessingProgress(0);
    setProcessingStatus("");
    setStep("upload");
  };

  // Render different steps
  const renderStep = () => {
    switch (step) {
      case "upload":
        return (
          <div className="space-y-4">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`
                                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                                ${isDragActive ? "border-primary bg-primary-subtle" : "border-border hover:border-primary"}
                                ${isDragReject ? "border-danger bg-danger-subtle" : ""}
                            `}
              style={{
                borderColor: isDragActive ? "var(--primary)" : "var(--border)",
                backgroundColor: isDragActive
                  ? "var(--primary-subtle)"
                  : "var(--bg-main)",
              }}
            >
              <input {...getInputProps()} />
              <HiOutlineUpload
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: "var(--text-muted)" }}
              />
              <p
                className="text-base font-medium mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                {isDragActive ? "Drop file here" : "Drag & drop CSV file here"}
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                or click to browse
              </p>
              <p
                className="text-xs mt-2"
                style={{ color: "var(--text-muted)" }}
              >
                Accepted: {acceptedFormats.join(", ")} • Max size:{" "}
                {maxSize / (1024 * 1024)}MB
              </p>
            </div>

            {/* Template Download */}
            {templateUrl && (
              <a
                href={templateUrl}
                download
                className="inline-flex items-center gap-2 text-sm"
                style={{ color: "var(--primary)" }}
              >
                <HiOutlineDocumentDownload className="w-4 h-4" />
                Download Template
              </a>
            )}

            {/* Error Display */}
            {error && (
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: "var(--danger-subtle)",
                  color: "var(--danger)",
                  border: "1px solid var(--danger)",
                }}
              >
                <div className="flex items-center gap-2">
                  <HiOutlineX className="w-5 h-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}
          </div>
        );

      case "validating":
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p
              className="text-base font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Validating file...
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Please wait while we check your data
            </p>
          </div>
        );

      case "review":
        return (
          <div className="space-y-4">
            {/* Summary */}
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: "var(--bg-main)" }}
            >
              <h4
                className="font-medium mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                Validation Summary
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="text-center p-3 rounded-lg"
                  style={{ backgroundColor: "var(--status-present-subtle)" }}
                >
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "var(--status-present)" }}
                  >
                    {validationResult?.valid_count || 0}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Valid Rows
                  </p>
                </div>
                <div
                  className="text-center p-3 rounded-lg"
                  style={{ backgroundColor: "var(--danger-subtle)" }}
                >
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "var(--danger)" }}
                  >
                    {validationResult?.error_count || 0}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Errors
                  </p>
                </div>
              </div>
            </div>

            {/* Errors List */}
            {validationResult?.errors?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Errors ({validationResult.errors.length})
                  </h5>
                  <button
                    onClick={downloadErrorReport}
                    className="inline-flex items-center gap-1 text-xs"
                    style={{ color: "var(--primary)" }}
                  >
                    <HiOutlineArrowDown className="w-3 h-3" />
                    Download Report
                  </button>
                </div>
                <div
                  className="max-h-40 overflow-y-auto rounded-lg"
                  style={{ backgroundColor: "var(--bg-main)" }}
                >
                  {validationResult.errors.slice(0, 10).map((err, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2 text-sm border-b last:border-0"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <HiOutlineExclamation
                        className="w-4 h-4 mt-0.5 shrink-0"
                        style={{ color: "var(--danger)" }}
                      />
                      <div>
                        <span className="font-medium">
                          Row {err.row_number}:
                        </span>{" "}
                        <span style={{ color: "var(--text-secondary)" }}>
                          {err.error}
                        </span>
                      </div>
                    </div>
                  ))}
                  {validationResult.errors.length > 10 && (
                    <p
                      className="text-center text-xs p-2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      ...and {validationResult.errors.length - 10} more errors
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={handleReset}
                className="flex-1"
              >
                Cancel
              </Button>
              {validationResult?.error_count > 0 && (
                <Button
                  variant="outline"
                  onClick={downloadErrorReport}
                  className="flex-1"
                >
                  Download Errors
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleProcess}
                disabled={validationResult?.valid_count === 0}
                className="flex-1"
              >
                {validationResult?.valid_count > 0
                  ? `Upload ${validationResult.valid_count} Records`
                  : "No Valid Records"}
              </Button>
            </div>
          </div>
        );

      case "processing":
        return (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span
                    className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full"
                    style={{
                      backgroundColor: "var(--primary-subtle)",
                      color: "var(--primary)",
                    }}
                  >
                    Processing
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className="text-xs font-semibold inline-block"
                    style={{ color: "var(--primary)" }}
                  >
                    {processingProgress}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                <div
                  style={{
                    width: `${processingProgress}%`,
                    backgroundColor: "var(--primary)",
                    transition: "width 0.3s ease",
                  }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
                ></div>
              </div>
            </div>

            <p
              className="text-center text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {processingStatus}
            </p>

            <p
              className="text-center text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              Please wait while we process your data...
            </p>
          </div>
        );

      case "complete":
        return (
          <div className="text-center py-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "var(--status-present-subtle)" }}
            >
              <HiOutlineCheck
                className="w-8 h-8"
                style={{ color: "var(--status-present)" }}
              />
            </div>

            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Upload Complete!
            </h3>

            <div
              className="p-4 rounded-xl text-left mb-4"
              style={{ backgroundColor: "var(--bg-main)" }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Total Processed
                  </p>
                  <p
                    className="text-xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {uploadResult?.total || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Successful
                  </p>
                  <p
                    className="text-xl font-bold"
                    style={{ color: "var(--status-present)" }}
                  >
                    {uploadResult?.success || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Failed
                  </p>
                  <p
                    className="text-xl font-bold"
                    style={{
                      color:
                        uploadResult?.failed > 0
                          ? "var(--danger)"
                          : "var(--text-primary)",
                    }}
                  >
                    {uploadResult?.failed || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Skipped
                  </p>
                  <p
                    className="text-xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {uploadResult?.skipped || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Download Summary */}
            {uploadResult?.summary_url && (
              <a
                href={uploadResult.summary_url}
                className="inline-flex items-center gap-2 text-sm mb-4"
                style={{ color: "var(--primary)" }}
              >
                <HiOutlineDocumentDownload className="w-4 h-4" />
                Download Summary Report
              </a>
            )}

            <Button variant="primary" onClick={handleReset} className="w-full">
              Upload More
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="rounded-xl p-6 max-w-lg mx-auto"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      <h3
        className="text-lg font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h3>

      {renderStep()}
    </div>
  );
};

export default BulkUpload;
