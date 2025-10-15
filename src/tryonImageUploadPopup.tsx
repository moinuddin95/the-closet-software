import { render } from "preact";
import { useState } from "preact/hooks";
import "./tryonImageUploadPopup.css";

export function TryonImageUploadPopup() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onClose = () => {
    document.getElementById("closet-tryon-popup-root")!.style.display = "none";
  };

  function handleUploadClick() {
    // Send the selected file to the background script
    if (!selectedFile) {
      //TODO: replace alert with a toast notificationq
      alert("Please select an image first.");
      return;
    }
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = async () => {
        const fileData = reader.result as string; // data URL
        console.log("file data received:", fileData?.slice(0, 64), "...");
      };
      reader.readAsDataURL(selectedFile);
    }
  }

  function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      setSelectedFile(input.files[0]);
    }
  }

  return (
    <div className="tryon-popup-overlay">
      <div className="tryon-popup-container">
        <div className="tryon-popup-header">
          <h2>Upload Your Image</h2>
          <button className="tryon-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="tryon-popup-content">
          <div className="tryon-upload-area">
            {selectedFile ? (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt={selectedFile.name}
                className="tryon-upload-preview"
              />
            ) : (
              <>
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  opacity="0.3"
                >
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                </svg>
                <p className="tryon-upload-text">
                  "Click to select an image or drag and drop"
                </p>
                <input
                  type="file"
                  id="tryon-file-input"
                  className="tryon-file-input"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="tryon-file-input"
                  className="tryon-upload-label"
                >
                  Choose File
                </label>
              </>
            )}
          </div>
          <div className="tryon-popup-actions">
            <button className="tryon-btn tryon-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="tryon-btn tryon-upload-btn"
              onClick={handleUploadClick}
              disabled={!selectedFile}
            >
              Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const container = document.getElementById("closet-tryon-popup-root");
if (container) {
  render(<TryonImageUploadPopup />, container);
}
