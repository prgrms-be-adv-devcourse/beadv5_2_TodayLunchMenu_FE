import { useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <section className="flex min-h-[calc(100svh-8rem)] items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-[32px] bg-white px-8 py-12 text-center shadow-sm ring-1 ring-gray-200 sm:px-12 sm:py-14">
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              페이지를 찾을 수 없어요
            </h1>
            <p className="text-base leading-7 text-gray-500 sm:text-lg">
              입력한 주소가 잘못됐거나, 페이지가 이동/삭제됐을 수 있어요.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button type="button" size="lg" onClick={() => navigate("/products")}>
              상품 목록으로
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => navigate("/")}
            >
              홈으로
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
