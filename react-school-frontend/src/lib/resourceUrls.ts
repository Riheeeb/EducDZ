const API_ORIGIN = "http://localhost:8080";

export const getResourceUrl = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  if (trimmed.startsWith("/resources/")) {
    return `${API_ORIGIN}/api/v1/resources/files/${encodeURIComponent(trimmed.slice("/resources/".length))}`;
  }
  if (trimmed.startsWith("uploads/resources/") || trimmed.startsWith("/uploads/resources/")) {
    const filename = trimmed.split("/").pop() ?? "";
    return `${API_ORIGIN}/api/v1/resources/files/${encodeURIComponent(filename)}`;
  }
  return `${API_ORIGIN}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
};
