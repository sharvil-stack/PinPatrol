import api from "./api";


const resourceTypeFor = (mediaType) => {
  if (mediaType === "IMAGE") return "image";
  return "video";
};

export const mediaTypeFromFile = (file) => {
  if (file.type.startsWith("image/")) return "IMAGE";
  if (file.type.startsWith("video/")) return "VIDEO";
  if (file.type.startsWith("audio/")) return "AUDIO";
  return null;
};

export const getUploadSignature = async () => {
  const response = await api.get("/api/media/signature");
  return response.data; 
};


export const uploadToCloudinary = async (file, signatureData, mediaType) => {
  const { timestamp, signature, apiKey, cloudName, folder } = signatureData;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", folder);

  const resourceType = resourceTypeFor(mediaType);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || "Upload to Cloudinary failed");
  }

  return res.json(); 
};

export const attachMediaToReport = async (reportId, { url, type }) => {
  const response = await api.post(`/api/reports/${reportId}/media`, { url, type });
  return response.data;
};

export const uploadReportMedia = async (reportId, file) => {
  const mediaType = mediaTypeFromFile(file);
  if (!mediaType) {
    throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
  }

  const signatureData = await getUploadSignature();
  const cloudinaryResult = await uploadToCloudinary(file, signatureData, mediaType);
  return attachMediaToReport(reportId, { url: cloudinaryResult.secure_url, type: mediaType });
};