const KAKAO_LINK_STORAGE_KEY = "kakaoPendingLink";

function getPendingKakaoLink() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(KAKAO_LINK_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    window.sessionStorage.removeItem(KAKAO_LINK_STORAGE_KEY);
    return null;
  }
}

function setPendingKakaoLink(payload) {
  if (typeof window === "undefined") {
    return;
  }

  if (!payload?.linkToken) {
    clearPendingKakaoLink();
    return;
  }

  window.sessionStorage.setItem(
    KAKAO_LINK_STORAGE_KEY,
    JSON.stringify(payload),
  );
}

function clearPendingKakaoLink() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(KAKAO_LINK_STORAGE_KEY);
}

export { clearPendingKakaoLink, getPendingKakaoLink, setPendingKakaoLink };
