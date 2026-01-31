// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, storage } from "../firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { updateProfile } from "firebase/auth"; // ← เพิ่ม import นี้
import "./profile.css";

export default function Profile({ user, theme }) {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [previewURL, setPreviewURL] = useState(user?.photoURL || "");
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ดึงข้อมูล phoneNumber จาก Firestore เมื่อ mount
  useEffect(() => {
    const fetchPhoneNumber = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setPhoneNumber(docSnap.data().phoneNumber || "");
        }
      } catch (error) {
        console.error("Error fetching phone number:", error);
      }
    };
    
    if (user?.uid) {
      fetchPhoneNumber();
    }
  }, [user?.uid]);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage("❌ File size must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setMessage("❌ Please select an image file");
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewURL(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to Firebase Storage
  const uploadImageToFirebaseStorage = async (file) => {
    try {
      const timestamp = Date.now();
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.uid}_${timestamp}.${fileExt}`;
      const storageRef = ref(storage, `user-profiles/${user.uid}/${fileName}`);

      // Upload file
      await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  };

  // Delete old image from Firebase Storage
  const deleteOldImage = async (oldPhotoURL) => {
    try {
      if (oldPhotoURL && oldPhotoURL.includes("firebaseapp.com")) {
        const fileRef = ref(storage, oldPhotoURL);
        await deleteObject(fileRef).catch(() => {
          // Ignore error if file doesn't exist
        });
      }
    } catch (error) {
      console.error("Error deleting old image:", error);
    }
  };

  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      let finalPhotoURL = user?.photoURL || "";

      // Upload file if selected
      if (photoFile) {
        setMessage("📸 Uploading image...");
        
        // Delete old image if exists
        if (user?.photoURL) {
          await deleteOldImage(user.photoURL);
        }

        finalPhotoURL = await uploadImageToFirebaseStorage(photoFile);
      }

      // Validate required fields
      if (!displayName.trim()) {
        setMessage("❌ Display name is required");
        setLoading(false);
        return;
      }

      // Step 1: อัปเดต Firebase Auth
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim(),
          photoURL: finalPhotoURL || null
        });
        console.log("✅ Firebase Auth updated");
      }

      // Step 2: อัปเดต Firestore
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        photoURL: finalPhotoURL,
        updatedAt: new Date(),
        lastUpdatedBy: "user"
      });
      console.log("✅ Firestore updated");

      // Update local state
      setPhotoFile(null);
      setMessage("✅ Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Clear image
  const clearImage = () => {
    setPhotoFile(null);
    setPreviewURL(user?.photoURL || "");
  };

  const displayImage = previewURL || user?.photoURL;

  return (
    <div className={`page-container ${theme === "dark" ? "dark-mode" : "light-mode"}`}>
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
        <h1>👤 Profile</h1>
      </header>

      <main className="page-content">
        <div className="profile-card">
          {/* Profile Avatar */}
          <div className="avatar-section">
            {displayImage ? (
              <div className="avatar-container">
                <img 
                  src={displayImage} 
                  alt="Profile" 
                  className="avatar-image" 
                  onError={(e) => {
                    e.target.src = "";
                    setMessage("⚠️ Failed to load image.");
                  }} 
                />
                {previewURL && (
                  <button type="button" className="clear-image-btn" onClick={clearImage} title="Remove image">
                    ✕
                  </button>
                )}
              </div>
            ) : (
              <div className="avatar-placeholder">👤</div>
            )}
          </div>

          {/* Profile Form */}
          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="form-input disabled"
              />
            </div>

            <div className="form-group">
              <label>Display Name *</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                className="form-input"
              />
            </div>

            {/* Photo Upload */}
            <div className="photo-section">
              <h3>Upload Photo</h3>
              
              <div className="form-group">
                <label>Choose File</label>
                <div className="file-upload-area">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p>Click to upload or drag and drop</p>
                  <span>PNG, JPG, GIF up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="file-input"
                  />
                </div>
                {photoFile && (
                  <div className="file-info">
                    <p>✓ {photoFile.name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`message ${message.includes("✅") ? "success" : message.includes("⚠️") || message.includes("📸") ? "info" : "error"}`}>
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>

          {/* User Info */}
          <div className="user-info">
            <h3>Account Information</h3>
            <div className="info-row">
              <span>User ID:</span>
              <code>{user?.uid}</code>
            </div>
            <div className="info-row">
              <span>Created:</span>
              <span>{user?.metadata?.createdAt ? new Date(user.metadata.createdAt).toLocaleDateString() : "N/A"}</span>
            </div>
            <div className="info-row">
              <span>Last Updated:</span>
              <span>{user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : "N/A"}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}