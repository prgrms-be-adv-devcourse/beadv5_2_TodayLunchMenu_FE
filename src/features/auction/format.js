const formatter = new Intl.NumberFormat("ko-KR");

function formatKRW(value) {
  return formatter.format(Math.max(0, Math.round(Number(value) || 0)));
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

const STATUS_LABEL = {
  WAITING: "대기 중",
  ONGOING: "진행 중",
  PENDING_PAYMENT: "결제 대기",
  COMPLETED: "낙찰 완료",
  FAILED: "유찰",
};

function statusLabel(status) {
  return STATUS_LABEL[status] || status || "";
}

export { formatKRW, pad2, statusLabel };
