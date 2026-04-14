const TOSS_SDK_SRC = "https://js.tosspayments.com/v2/standard";

let tossSdkPromise;

function loadTossPaymentsSdk() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저 환경에서만 토스 SDK를 로드할 수 있습니다."));
  }

  if (window.TossPayments) {
    return Promise.resolve(window.TossPayments);
  }

  if (tossSdkPromise) {
    return tossSdkPromise;
  }

  tossSdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${TOSS_SDK_SRC}"]`);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.TossPayments), {
        once: true,
      });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("토스페이먼츠 SDK를 불러오지 못했습니다.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = TOSS_SDK_SRC;
    script.async = true;
    script.onload = () => resolve(window.TossPayments);
    script.onerror = () => reject(new Error("토스페이먼츠 SDK를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });

  return tossSdkPromise;
}

export { loadTossPaymentsSdk };
