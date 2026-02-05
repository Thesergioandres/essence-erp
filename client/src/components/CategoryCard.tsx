import { useNavigate } from "react-router-dom";
import type { Category } from "../features/inventory/types/product.types";

interface CategoryCardProps {
  category: Category;
  productCount?: number;
}

export default function CategoryCard({
  category,
  productCount,
}: CategoryCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/categoria/${category.slug}`)}
      className="bg-linear-to-br group min-h-[100px] cursor-pointer overflow-hidden rounded-xl border border-gray-700 from-purple-900/30 to-gray-800/50 p-5 backdrop-blur-lg transition hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] sm:min-h-[120px] sm:p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 truncate text-lg font-bold text-white group-hover:text-purple-400 sm:text-xl md:text-2xl">
            {category.name}
          </h3>
          {category.description && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-gray-400 sm:mt-2 sm:text-base">
              {category.description}
            </p>
          )}
          {productCount !== undefined && (
            <p className="mt-2 text-xs font-medium text-gray-500 sm:mt-3 sm:text-sm">
              {productCount} {productCount === 1 ? "producto" : "productos"}
            </p>
          )}
        </div>
        <div className="shrink-0">
          <svg
            className="h-7 w-7 text-purple-400 transition group-hover:translate-x-1 sm:h-8 sm:w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
