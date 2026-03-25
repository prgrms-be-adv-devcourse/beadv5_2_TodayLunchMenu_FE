import FormField from "../common/FormField";
import Input from "../common/Input";
import Button from "../common/Button";

const CATEGORY_OPTIONS = [
  { value: "GOODS", label: "굿즈" },
  { value: "LIVING", label: "리빙" },
  { value: "ART", label: "아트" },
  { value: "STATIONERY", label: "문구" },
];

const STATUS_OPTIONS = [
  { value: "ON_SALE", label: "판매중" },
  { value: "SOLD_OUT", label: "품절" },
  { value: "HIDDEN", label: "비공개" },
];

export default function SellerProductForm({
  form,
  errors,
  onChange,
  onIncreaseStock,
  onDecreaseStock,
  onSubmit,
  submitText = "상품 등록",
  secondaryAction,
}) {
  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      <section className="rounded-[28px] bg-white/80 p-5 shadow-sm ring-1 ring-purple-100">
        <div className="mb-5 aspect-square w-full rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/80">
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-3xl text-violet-700">
              📷
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900">대표 이미지 업로드</p>
              <p className="mt-1 text-xs text-gray-500">PNG, JPG 최대 10MB</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <FormField
            label="상품명"
            htmlFor="name"
            required
            error={errors.name}
          >
            <Input
              id="name"
              placeholder="예: 제로마켓 머그컵"
              value={form.name}
              onChange={onChange("name")}
              error={!!errors.name}
            />
          </FormField>

          <FormField
            label="카테고리"
            htmlFor="category"
            required
            error={errors.category}
          >
            <select
              id="category"
              value={form.category}
              onChange={onChange("category")}
              className="h-14 w-full rounded-xl bg-purple-100/70 px-4 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-violet-300"
            >
              <option value="">카테고리 선택</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="재고"
              htmlFor="stock"
              required
              error={errors.stock}
            >
              <div className="flex h-14 items-center rounded-xl bg-purple-100/70 px-2">
                <button
                  type="button"
                  onClick={onDecreaseStock}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-violet-700 transition hover:bg-white"
                >
                  −
                </button>

                <input
                  id="stock"
                  type="number"
                  value={form.stock}
                  onChange={onChange("stock")}
                  className="w-full bg-transparent text-center font-bold outline-none"
                />

                <button
                  type="button"
                  onClick={onIncreaseStock}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-violet-700 transition hover:bg-white"
                >
                  ＋
                </button>
              </div>
            </FormField>

            <FormField
              label="가격"
              htmlFor="price"
              required
              error={errors.price}
            >
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">
                  ₩
                </span>
                <Input
                  id="price"
                  type="number"
                  placeholder="0"
                  value={form.price}
                  onChange={onChange("price")}
                  error={!!errors.price}
                  className="pl-8 text-right"
                />
              </div>
            </FormField>
          </div>

          <FormField
            label="상태"
            htmlFor="status"
            required
            error={errors.status}
          >
            <select
              id="status"
              value={form.status}
              onChange={onChange("status")}
              className="h-14 w-full rounded-xl bg-purple-100/70 px-4 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-violet-300"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="상세 설명"
            htmlFor="description"
            required
            error={errors.description}
          >
            <textarea
              id="description"
              rows={5}
              placeholder="상품 설명을 입력해 주세요."
              value={form.description}
              onChange={onChange("description")}
              className="w-full rounded-xl bg-purple-100/70 p-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-500/60 focus:ring-2 focus:ring-violet-300"
            />
          </FormField>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        {secondaryAction}
        <Button type="submit" size="lg" className="w-full">
          {submitText}
        </Button>
      </div>
    </form>
  );
}