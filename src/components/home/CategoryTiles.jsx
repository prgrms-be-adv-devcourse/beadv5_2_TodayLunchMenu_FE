import { Link } from "react-router-dom";
import {
  BookOpen,
  Camera,
  Car,
  Dumbbell,
  Gamepad2,
  Home,
  Laptop,
  Monitor,
  Music,
  Shirt,
  ShoppingBag,
  Sparkles,
  Tag,
  UtensilsCrossed,
} from "lucide-react";

const ICON_MAP = [
  { keywords: ["전자", "it", "디지털", "컴퓨터", "pc", "스마트"], icon: Monitor },
  { keywords: ["패션", "의류", "옷"], icon: Shirt },
  { keywords: ["식품", "음식", "식재료", "먹거리"], icon: UtensilsCrossed },
  { keywords: ["스포츠", "헬스", "운동", "아웃도어"], icon: Dumbbell },
  { keywords: ["도서", "책", "만화"], icon: BookOpen },
  { keywords: ["가구", "인테리어", "홈", "생활"], icon: Home },
  { keywords: ["뷰티", "화장", "코스메틱", "스킨케어"], icon: Sparkles },
  { keywords: ["자동차", "바이크"], icon: Car },
  { keywords: ["게임", "장난감", "완구", "취미"], icon: Gamepad2 },
  { keywords: ["노트북", "laptop", "태블릿"], icon: Laptop },
  { keywords: ["가방", "핸드백", "지갑"], icon: ShoppingBag },
  { keywords: ["음악", "악기", "오디오"], icon: Music },
  { keywords: ["카메라", "사진", "렌즈"], icon: Camera },
];

const TILE_COLORS = [
  { bg: "bg-blue-50", icon: "text-blue-600" },
  { bg: "bg-purple-50", icon: "text-purple-600" },
  { bg: "bg-green-50", icon: "text-green-600" },
  { bg: "bg-orange-50", icon: "text-orange-600" },
  { bg: "bg-pink-50", icon: "text-pink-600" },
  { bg: "bg-teal-50", icon: "text-teal-600" },
  { bg: "bg-indigo-50", icon: "text-indigo-600" },
  { bg: "bg-yellow-50", icon: "text-yellow-600" },
];

function getCategoryIcon(name) {
  const lower = (name || "").toLowerCase();
  return ICON_MAP.find(({ keywords }) => keywords.some((kw) => lower.includes(kw)))?.icon ?? Tag;
}

export default function CategoryTiles({ categories }) {
  if (!categories?.length) return null;

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
      {categories.map((category, i) => {
        const Icon = getCategoryIcon(category.name);
        const color = TILE_COLORS[i % TILE_COLORS.length];
        return (
          <Link
            key={category.id}
            to={`/products?categoryId=${category.id}`}
            className="flex flex-col items-center gap-2 rounded-lg border border-gray-100 bg-white p-3 text-center transition hover:border-blue-200 hover:shadow-sm"
          >
            <div
              className={[
                "flex h-10 w-10 items-center justify-center rounded-full",
                color.bg,
              ].join(" ")}
            >
              <Icon className={["h-5 w-5", color.icon].join(" ")} />
            </div>
            <span className="text-[11px] font-medium leading-tight text-gray-700">
              {category.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
