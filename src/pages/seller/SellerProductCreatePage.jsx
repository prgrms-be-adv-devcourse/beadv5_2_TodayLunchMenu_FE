import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer";
import Button from "../../components/common/Button";
import SellerProductForm from "../../components/seller/SellerProductForm";

export default function SellerProductCreatePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    category: "",
    stock: 1,
    price: "",
    description: "",
    status: "ON_SALE",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (key) => (e) => {
    const value = key === "stock" || key === "price" ? e.target.value : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleIncreaseStock = () => {
    setForm((prev) => ({ ...prev, stock: Number(prev.stock || 0) + 1 }));
  };

  const handleDecreaseStock = () => {
    setForm((prev) => ({
      ...prev,
      stock: Math.max(0, Number(prev.stock || 0) - 1),
    }));
  };

  const validate = () => {
    const next = {};

    if (!form.name.trim()) next.name = "상품명을 입력해 주세요.";
    if (!form.category) next.category = "카테고리를 선택해 주세요.";
    if (Number(form.stock) < 0) next.stock = "재고는 0 이상이어야 합니다.";
    if (!String(form.price).trim()) next.price = "가격을 입력해 주세요.";
    if (Number(form.price) <= 0) next.price = "가격은 0보다 커야 합니다.";
    if (!form.description.trim()) next.description = "설명을 입력해 주세요.";
    if (!form.status) next.status = "상태를 선택해 주세요.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      status: form.status,
      category: form.category,
    };

    console.log("create product payload", payload);
    navigate("/seller/products");
  };

  return (
    <PageContainer>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">
            Drafting
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">
            새 상품 등록
          </h1>
        </div>
        <span className="rounded-full bg-purple-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700">
          작성 중
        </span>
      </div>

      <SellerProductForm
        form={form}
        errors={errors}
        onChange={handleChange}
        onIncreaseStock={handleIncreaseStock}
        onDecreaseStock={handleDecreaseStock}
        onSubmit={handleSubmit}
        submitText="상품 등록"
        secondaryAction={
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => console.log("save draft", form)}
          >
            임시 저장
          </Button>
        }
      />
    </PageContainer>
  );
}