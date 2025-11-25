// Reusable form for submitting grievances
import React, { useState } from "react";
import { useTranslation, useTranslatedText } from "../hooks/useTranslation";
import SpeakButton from "./SpeakButton";
import SpeechToText from "./SpeechToText";
import "./Dashboard.css";

const GrievanceForm = ({ onSubmit }) => {
  const { t, currentLanguage } = useTranslation();

  // Component for translated text with TTS
  const TranslatedSpeakButton = ({ text }) => {
    const { translatedText } = useTranslatedText(text);
    return <SpeakButton text={translatedText} />;
  };

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [hostelType, setHostelType] = useState("");
  const [expectedDuration, setExpectedDuration] = useState("");
  const [customResolutionDays, setCustomResolutionDays] = useState(0);
  const [customResolutionHours, setCustomResolutionHours] = useState(0);
  const [attachment, setAttachment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Category keywords mapping
  const categoryKeywords = {
    Academic: [
      "grade",
      "exam",
      "professor",
      "class",
      "course",
      "lecture",
      "assignment",
      "teacher",
      "study",
      "marks",
      "syllabus",
      "test",
      "quiz",
      "result",
      "attendance",
      "timetable",
      "schedule",
      "tutorial",
      "practical",
      "theory",
      "evaluation",
      "assessment",
      "homework",
      "project",
      "presentation",
      "viva",
      "internal",
      "external",
      "semester",
      "fail",
      "pass",
      "cgpa",
      "gpa",
      "credit",
      "curriculum",
      "faculty",
      "hod",
      "department",
      "lab work",
      "record",
      "notebook",
      "guidance",
      "doubt",
      "confusion",
      "teaching",
      "learning",
    ],
    Infrastructure: [
      "building",
      "classroom",
      "laboratory",
      "lab",
      "facilities",
      "maintenance",
      "repair",
      "equipment",
      "projector",
      "ac",
      "fan",
      "washroom",
      "toilet",
      "restroom",
      "bathroom",
      "door",
      "window",
      "bench",
      "desk",
      "chair",
      "table",
      "board",
      "whiteboard",
      "blackboard",
      "ceiling",
      "floor",
      "wall",
      "paint",
      "light",
      "lighting",
      "bulb",
      "tube",
      "ventilation",
      "cleanliness",
      "dustbin",
      "garbage",
      "drain",
      "leak",
      "seepage",
      "crack",
      "broken",
      "damaged",
      "college building",
      "campus",
      "corridor",
      "staircase",
      "lift",
      "elevator",
      "compound",
      "gate",
    ],
    Hostel: [
      "room",
      "mess",
      "food",
      "accommodation",
      "warden",
      "hygiene",
      "cleaning",
      "water",
      "electricity",
      "wifi",
      "roommate",
      "noise",
      "disturbance",
      "privacy",
      "bed",
      "mattress",
      "pillow",
      "blanket",
      "cupboard",
      "almirah",
      "locker",
      "bathroom",
      "toilet",
      "shower",
      "washroom",
      "laundry",
      "washing",
      "hot water",
      "cold water",
      "drinking water",
      "purifier",
      "ro",
      "mess food",
      "breakfast",
      "lunch",
      "dinner",
      "quality",
      "quantity",
      "taste",
      "menu",
      "dining hall",
      "canteen",
      "safety",
      "security",
      "guard",
      "cctv",
      "late entry",
      "entry time",
      "exit time",
      "visitor",
      "guest",
      "complaint",
      "common room",
      "tv room",
      "study room",
    ],
    Library: [
      "book",
      "journal",
      "librarian",
      "circulation",
      "return",
      "fine",
      "reading",
      "reference",
      "digital",
      "magazine",
      "newspaper",
      "publication",
      "issue",
      "borrow",
      "lending",
      "overdue",
      "penalty",
      "library card",
      "membership",
      "catalog",
      "search",
      "unavailable",
      "out of stock",
      "reservation",
      "booking",
      "seat",
      "sitting",
      "timing",
      "opening hours",
      "closing time",
      "holiday",
      "air conditioning",
      "noise",
      "silent",
      "study area",
      "reading room",
      "e-book",
      "online",
      "database",
      "journal access",
      "photocopy",
      "xerox",
      "printing",
      "scanning",
      "computer",
      "internet",
      "wifi",
    ],
    Transport: [
      "bus",
      "vehicle",
      "timing",
      "route",
      "driver",
      "schedule",
      "late",
      "transport",
      "parking",
      "delay",
      "cancelled",
      "overcrowded",
      "crowded",
      "standing",
      "seat",
      "conductor",
      "pass",
      "ticket",
      "fee",
      "route change",
      "stop",
      "pick up",
      "drop",
      "morning",
      "evening",
      "breakdown",
      "maintenance",
      "condition",
      "cleanliness",
      "ac bus",
      "non ac",
      "college bus",
      "shuttle",
      "waiting time",
      "rash driving",
      "safety",
      "accident",
      "two wheeler",
      "bike",
      "cycle",
      "car",
      "parking space",
      "parking lot",
      "vehicle stand",
      "gate pass",
    ],
    Administrative: [
      "fee",
      "document",
      "certificate",
      "administration",
      "staff",
      "office",
      "payment",
      "id card",
      "admission",
      "receipt",
      "invoice",
      "refund",
      "scholarship",
      "form",
      "application",
      "bonafide",
      "tc",
      "transfer certificate",
      "mark sheet",
      "transcript",
      "degree",
      "diploma",
      "provisional",
      "original",
      "duplicate",
      "attestation",
      "verification",
      "signature",
      "stamp",
      "clerk",
      "accountant",
      "cashier",
      "counter",
      "delay",
      "pending",
      "rejected",
      "approved",
      "process",
      "procedure",
      "rule",
      "policy",
      "notice",
      "circular",
      "announcement",
      "information",
      "communication",
      "response",
      "reply",
      "exam form",
      "registration",
      "enrollment",
      "roll number",
      "student portal",
      "login",
      "password",
      "account",
    ],
  };

  const suggestCategory = () => {
    const combinedText = `${title} ${description}`.toLowerCase();
    let bestMatch = {
      category: "",
      matches: 0,
    };

    // Check each category's keywords against the text
    Object.entries(categoryKeywords).forEach(([categoryName, keywords]) => {
      const matchCount = keywords.reduce((count, keyword) => {
        return count + (combinedText.includes(keyword.toLowerCase()) ? 1 : 0);
      }, 0);

      if (matchCount > bestMatch.matches) {
        bestMatch = {
          category: categoryName,
          matches: matchCount,
        };
      }
    });

    // Only suggest if we found matches
    if (bestMatch.matches > 0) {
      setCategory(bestMatch.category);
      // Show feedback to user
      const feedback = document.createElement("div");
      feedback.textContent = `Suggested category: ${bestMatch.category}`;
      feedback.className = "suggestion-feedback";
      document.body.appendChild(feedback);
      setTimeout(() => feedback.remove(), 3000);
    } else {
      // Show message when no category can be suggested
      const feedback = document.createElement("div");
      feedback.textContent =
        "No matching category found. Please add more details.";
      feedback.className = "suggestion-feedback";
      feedback.style.background =
        "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
      document.body.appendChild(feedback);
      setTimeout(() => feedback.remove(), 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    console.log("📝 GrievanceForm handleSubmit triggered");

    // Validate form
    if (
      !title.trim() ||
      !description.trim() ||
      !category ||
      !expectedDuration
    ) {
      console.warn("⚠️ Validation failed: Missing fields");
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (category === "Hostel" && !hostelType) {
      console.warn("⚠️ Validation failed: Missing Hostel Type");
      setErrorMessage("Please select a Hostel Type (Boys/Girls).");
      return;
    }

    // Validate custom inputs if Custom selected
    if (expectedDuration === "Custom") {
      if (!(customResolutionDays > 0 || customResolutionHours > 0)) {
        setErrorMessage(
          "Please provide a valid custom resolution time (days and/or hours)."
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      console.log("🚀 Preparing payload and calling parent onSubmit...");

      // Compute integer resolutionTime (in days) expected by backend
      let resolutionTime = 1; // default min 1 day
      if (expectedDuration === "Custom") {
        const totalDays =
          (customResolutionDays || 0) + (customResolutionHours || 0) / 24;
        resolutionTime = Math.max(1, Math.ceil(totalDays));
      } else if (expectedDuration.includes("24")) {
        resolutionTime = 1;
      } else if (expectedDuration.includes("3")) {
        resolutionTime = 3;
      } else if (
        expectedDuration.toLowerCase().includes("week") ||
        expectedDuration.includes("1 Week")
      ) {
        resolutionTime = 7;
      } else if (
        expectedDuration.toLowerCase().includes("flexible") ||
        expectedDuration === "Low (Flexible)"
      ) {
        resolutionTime = 14; // treat flexible as 2 weeks by default
      }

      const payload = {
        title,
        description,
        category,
        hostelType,
        expectedDuration,
        resolutionTime,
        customResolutionDays: customResolutionDays || 0,
        customResolutionHours: customResolutionHours || 0,
        attachment,
      };

      console.log("📦 Payload:", payload);

      const result = await onSubmit(payload);
      console.log("✅ Parent onSubmit returned:", result);

      if (!result || !result.success) {
        const errMsg =
          result?.error || "Submission failed with no error message.";
        console.warn("⚠️ Submission reported failure:", errMsg);
        setErrorMessage(errMsg);
        return; // do not proceed to success reset
      }

      // Show success feedback
      const feedback = document.createElement("div");
      feedback.textContent = "✅ Grievance submitted successfully!";
      feedback.className = "suggestion-feedback";
      feedback.style.background =
        "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)";
      document.body.appendChild(feedback);
      setTimeout(() => feedback.remove(), 3000);

      // Reset form
      setTitle("");
      setDescription("");
      setCategory("");
      setHostelType("");
      setExpectedDuration("");
      setCustomResolutionDays(0);
      setCustomResolutionHours(0);
      setAttachment(null);
      setErrorMessage("");

      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Error submitting grievance (exception):", error);
      setErrorMessage(
        "Failed to submit: " + (error.message || "Unknown error")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enable suggest button only when there's content
  const canSuggest = title.length > 0 || description.length > 0;

  return (
    <div className="form-container">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0 }}>{t("submit_complaint")}</h2>
        <TranslatedSpeakButton text={t("submit_complaint")} />
      </div>
      <form onSubmit={handleSubmit}>
        {errorMessage && (
          <div
            style={{
              padding: "10px",
              marginBottom: "15px",
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              borderRadius: "8px",
              border: "1px solid #fecaca",
              fontSize: "0.9rem",
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}
        <div className="form-group">
          <label>{t("complaint_title_label")}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("complaint_title")}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>{t("complaint_description_label")}</label>

          {/* Speech-to-Text Input */}
          <div style={{ marginBottom: "12px" }}>
            <SpeechToText
              onResult={(transcript) => {
                // Append to description (or replace if empty)
                setDescription((prev) =>
                  prev ? `${prev} ${transcript}` : transcript
                );

                // Show success feedback
                const feedback = document.createElement("div");
                feedback.textContent = `✅ Transcribed: "${transcript}"`;
                feedback.className = "suggestion-feedback";
                feedback.style.background =
                  "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)";
                document.body.appendChild(feedback);
                setTimeout(() => feedback.remove(), 3000);
              }}
              placeholder={`Speak in ${currentLanguage.toUpperCase()}...`}
              className="speech-input-form"
            />
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("complaint_description")}
            required
            className="form-textarea"
            rows="4"
          />
        </div>

        <div className="form-group">
          <label>{t("category_label")}</label>
          <div className="category-section">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (e.target.value !== "Hostel") {
                  setHostelType(""); // Reset hostel type if not Hostel category
                }
              }}
              required
              className="form-select"
            >
              <option value="">{t("select_category")}</option>
              {Object.keys(categoryKeywords).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={suggestCategory}
              className="suggest-button"
              disabled={!canSuggest}
            >
              {t("suggest_category")} ✨
            </button>
          </div>
        </div>

        {category === "Hostel" && (
          <div className="form-group">
            <label>Hostel Type</label>
            <select
              value={hostelType}
              onChange={(e) => setHostelType(e.target.value)}
              required
              className="form-select"
            >
              <option value="">Select Hostel Type</option>
              <option value="Boys Hostel">Boys Hostel</option>
              <option value="Girls Hostel">Girls Hostel</option>
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Expected Resolution Time</label>
          <select
            value={expectedDuration}
            onChange={(e) => setExpectedDuration(e.target.value)}
            required
            className="form-select"
          >
            <option value="">Select Duration</option>
            <option value="Urgent (24 Hours)">Urgent (Within 24 Hours)</option>
            <option value="High (3 Days)">High (Within 3 Days)</option>
            <option value="Normal (1 Week)">Normal (Within 1 Week)</option>
            <option value="Low (Flexible)">Low (Flexible)</option>
            <option value="Custom">Custom (Days + Hours)</option>
          </select>
        </div>

        {expectedDuration === "Custom" && (
          <div className="form-group">
            <label>Custom Resolution Time</label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="number"
                min="0"
                value={customResolutionDays}
                onChange={(e) =>
                  setCustomResolutionDays(parseInt(e.target.value || 0, 10))
                }
                className="form-input"
                placeholder="Days"
              />
              <input
                type="number"
                min="0"
                max="23"
                value={customResolutionHours}
                onChange={(e) =>
                  setCustomResolutionHours(parseInt(e.target.value || 0, 10))
                }
                className="form-input"
                placeholder="Hours"
              />
            </div>
            <small>
              Provide days and hours for the expected resolution (e.g., 2 days 6
              hours).
            </small>
          </div>
        )}

        <div className="form-group">
          <label>{t("attach_files")}</label>
          <input
            type="file"
            onChange={(e) => setAttachment(e.target.files[0])}
            accept="image/*"
            className="form-input"
          />
          <small>{t("max_file_size")}</small>
        </div>

        <button
          type="submit"
          className="submit-button"
          disabled={isSubmitting}
          onClick={() => console.log("🖱️ Submit button clicked")}
        >
          {isSubmitting ? t("submitting") : t("submit_complaint")}
        </button>
      </form>
    </div>
  );
};

export default GrievanceForm;
