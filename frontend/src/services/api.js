const API_URL = "http://localhost:8000";

export const uploadPDF = async (file) => {
  console.log("Starting upload process for file:", file.name, "Size:", file.size);
  const formData = new FormData();
  formData.append("file", file);

  try {
    console.log("Sending POST request to:", `${API_URL}/upload`);
    const response = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData, // the browser will automatically set the exact Content-Type with boundary for multipart/form-data
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      let errMessage = `HTTP Error ${response.status}`;
      try {
        const err = await response.json();
        console.error("Backend Error Details:", err);
        errMessage = err.detail || errMessage;
      } catch (e) {
        console.error("Could not parse error JSON", e);
      }
      throw new Error(errMessage);
    }
    
    const data = await response.json();
    console.log("Upload Success! Data received:", data);
    return data;
  } catch (error) {
    console.error("Fetch/Network Error in uploadPDF:", error);
    throw error;
  }
};

export const askQuestion = async (question, doc_id) => {
  const response = await fetch(`${API_URL}/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question, doc_id }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Failed to get answer");
  }
  return response.json();
};
