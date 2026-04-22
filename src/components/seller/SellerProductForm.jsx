import Button from "../common/Button";
import FormField from "../common/FormField";
import Input from "../common/Input";

function formatFileSize(size) {
  if (!size) {
    return "0 B";
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${size} B`;
}

export default function SellerProductForm({
  form,
  errors,
  categorySelection,
  categories,
  categoriesLoading,
  categoryError,
  imageConstraints,
  onChange,
  onCategoryChange,
  onIncreaseStock,
  onDecreaseStock,
  onImagesChange,
  onThumbnailSelect,
  onRemoveImage,
  onSubmit,
  submitText = "상품 등록",
  secondaryAction,
  aiDraftAction,
}) {
  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      <section className="rounded-[28px] bg-white/80 p-5 shadow-sm ring-1 ring-purple-100">
        <div className="grid grid-cols-1 gap-4">
          <FormField
            label="상품 이미지"
            htmlFor="images"
            error={errors.images}
            helpText={`최대 ${imageConstraints.maxFiles}개, ${imageConstraints.acceptedTypesLabel}, 파일당 최대 ${imageConstraints.maxFileSizeLabel}`}
          >
            <input
              id="images"
              type="file"
              accept={imageConstraints.accept}
              multiple
              onChange={onImagesChange}
              className="block w-full rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-violet-100 file:px-4 file:py-2 file:font-semibold file:text-violet-700 hover:file:bg-violet-200"
            />
          </FormField>

          {form.images.length > 0 ? (
            <div className="rounded-2xl bg-purple-50/80 p-4 ring-1 ring-purple-100">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">선택한 이미지</h3>
                <span className="text-xs text-gray-500">총 {form.images.length}개</span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {form.images.map((image, index) => {
                  const isThumbnail = form.thumbnailIndex === index;

                  return (
                    <div
                      key={`${image.file.name}-${index}`}
                      className={[
                        "overflow-hidden rounded-2xl bg-white ring-1 transition",
                        isThumbnail ? "ring-violet-500 shadow-md" : "ring-purple-100",
                      ].join(" ")}
                    >
                      <div className="aspect-square bg-purple-50">
                        <img
                          src={image.previewUrl}
                          alt={image.file.name}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="space-y-3 p-4">
                        <div>
                          <p className="truncate text-sm font-semibold text-gray-900">{image.file.name}</p>
                          <p className="mt-1 text-xs text-gray-500">{formatFileSize(image.file.size)}</p>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <label className="flex items-center gap-2 text-xs font-medium text-violet-700">
                            <input
                              type="radio"
                              name="thumbnailImage"
                              checked={isThumbnail}
                              onChange={() => onThumbnailSelect(index)}
                            />
                            썸네일
                          </label>

                          {isThumbnail ? (
                            <span className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-bold text-violet-700">
                              대표 이미지
                            </span>
                          ) : null}
                        </div>

                        <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => onRemoveImage(index)}>
                          제거
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {aiDraftAction}

          <FormField label="상품 유형" htmlFor="type" required error={errors.type}>
            <div className="flex gap-3">
              {[
                { value: "GENERAL", label: "일반" },
                { value: "AUCTION", label: "경매" },
              ].map((option) => {
                const checked = form.type === option.value;
                return (
                  <label
                    key={option.value}
                    className={[
                      "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition",
                      checked
                        ? "bg-violet-600 text-white shadow-sm"
                        : "bg-purple-100/70 text-gray-700 hover:bg-purple-200/70",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={option.value}
                      checked={checked}
                      onChange={onChange("type")}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </FormField>

          <FormField label="상품명" htmlFor="title" required error={errors.title}>
            <Input
              id="title"
              placeholder="예: 수제 머그컵"
              value={form.title}
              onChange={onChange("title")}
              error={!!errors.title}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField
              label="대분류"
              htmlFor="categoryDepth0"
              required
              error={errors.categoryId && !categorySelection.depth0Id ? errors.categoryId : undefined}
              helpText={categoriesLoading.depth0 ? "대분류를 불러오는 중입니다." : undefined}
            >
              <select
                id="categoryDepth0"
                value={categorySelection.depth0Id}
                onChange={(event) => onCategoryChange("depth0Id", event.target.value)}
                disabled={categoriesLoading.depth0}
                className="h-14 w-full rounded-xl bg-purple-100/70 px-4 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">대분류 선택</option>
                {categories.depth0.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="중분류"
              htmlFor="categoryDepth1"
              helpText={
                !categorySelection.depth0Id
                  ? "대분류를 먼저 선택해 주세요."
                  : categoriesLoading.depth1
                    ? "중분류를 불러오는 중입니다."
                    : categories.depth1.length === 0
                      ? "등록된 중분류가 없어 건너뜁니다."
                      : "선택 사항입니다."
              }
            >
              <select
                id="categoryDepth1"
                value={categorySelection.depth1Id}
                onChange={(event) => onCategoryChange("depth1Id", event.target.value)}
                disabled={!categorySelection.depth0Id || categoriesLoading.depth1 || categories.depth1.length === 0}
                className="h-14 w-full rounded-xl bg-purple-100/70 px-4 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">중분류 선택</option>
                {categories.depth1.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="소분류"
              htmlFor="categoryDepth2"
              error={categoryError || undefined}
              helpText={
                !categorySelection.depth1Id
                  ? "중분류를 먼저 선택해 주세요."
                  : categoriesLoading.depth2
                    ? "소분류를 불러오는 중입니다."
                    : categories.depth2.length === 0
                      ? "등록된 소분류가 없어 건너뜁니다."
                      : "선택 사항입니다."
              }
            >
              <select
                id="categoryDepth2"
                value={categorySelection.depth2Id}
                onChange={(event) => onCategoryChange("depth2Id", event.target.value)}
                disabled={!categorySelection.depth1Id || categoriesLoading.depth2 || categories.depth2.length === 0}
                className="h-14 w-full rounded-xl bg-purple-100/70 px-4 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">소분류 선택</option>
                {categories.depth2.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="rounded-2xl bg-purple-50/80 px-4 py-3 text-sm text-gray-700 ring-1 ring-purple-100">
            최종 선택 카테고리: <span className="font-semibold text-violet-700">{form.categoryId || "선택 없음"}</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="재고"
              htmlFor="stockQuantity"
              required
              error={errors.stockQuantity}
              helpText="최소 1개 이상"
            >
              <div className="flex h-14 items-center rounded-xl bg-purple-100/70 px-2">
                <button
                  type="button"
                  onClick={onDecreaseStock}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-violet-700 transition hover:bg-white"
                >
                  -
                </button>

                <input
                  id="stockQuantity"
                  type="number"
                  min="1"
                  step="1"
                  value={form.stockQuantity}
                  onChange={onChange("stockQuantity")}
                  className="w-full bg-transparent text-center font-bold outline-none"
                />

                <button
                  type="button"
                  onClick={onIncreaseStock}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-violet-700 transition hover:bg-white"
                >
                  +
                </button>
              </div>
            </FormField>

            <FormField
              label="가격"
              htmlFor="price"
              required
              error={errors.price}
              helpText="1,000원 이상 정수"
            >
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">
                  원
                </span>
                <Input
                  id="price"
                  type="number"
                  min="1000"
                  step="1"
                  placeholder="1000"
                  value={form.price}
                  onChange={onChange("price")}
                  error={!!errors.price}
                  className="pl-10 text-right"
                />
              </div>
            </FormField>
          </div>

          <FormField
            label="상세 설명"
            htmlFor="description"
            error={errors.description}
            helpText="비워둘 수 있습니다."
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

