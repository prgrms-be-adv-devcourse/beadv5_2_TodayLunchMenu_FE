import Button from "./Button";
import Modal from "./Modal";

export default function ConfirmModal({
  open,
  onClose,
  title,
  description,
  confirmText = "확인",
  cancelText = "취소",
  confirmVariant = "primary",
  onConfirm,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
          <Button type="button" variant={confirmVariant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
