import { Check, ChevronDown, Package, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Promotion } from "../features/settings/types/promotion.types";

interface PromotionSelectorProps {
  value: string;
  promotions: Promotion[];
  onChange: (promotionId: string, promotion?: Promotion) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  getPromotionAvailability?: (promotion: Promotion) => {
    available: boolean;
    reason?: string;
  };
}

const formatPrice = (promotion: Promotion) => {
  const fallbackTotal = (promotion.comboItems || []).reduce((sum, item) => {
    const product =
      typeof item.product === "object" && item.product !== null
        ? item.product
        : null;
    const unitPrice =
      item.unitPrice ?? product?.clientPrice ?? product?.suggestedPrice ?? 0;
    return sum + unitPrice * (item.quantity || 1);
  }, 0);

  return promotion.promotionPrice && promotion.promotionPrice > 0
    ? promotion.promotionPrice
    : fallbackTotal;
};

export default function PromotionSelector({
  value,
  promotions,
  onChange,
  placeholder = "Seleccionar promocion...",
  disabled = false,
  className = "",
  getPromotionAvailability,
}: PromotionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInContainer = containerRef.current?.contains(target);
      const clickedInDropdown = dropdownRef.current?.contains(target);

      if (!clickedInContainer && !clickedInDropdown) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setDropdownStyle({
        position: "absolute",
        top: "calc(100% + 4px)",
        left: 0,
        width: "100%",
        zIndex: 9999,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const selectedPromotion = useMemo(
    () => promotions.find(promo => promo._id === value),
    [promotions, value]
  );

  const filteredPromotions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return promotions;
    return promotions.filter(promo => {
      const name = promo.name?.toLowerCase() || "";
      const desc = promo.description?.toLowerCase() || "";
      return name.includes(term) || desc.includes(term);
    });
  }, [promotions, search]);

  const handleSelect = useCallback(
    (promotion: Promotion) => {
      const availability = getPromotionAvailability?.(promotion);
      if (availability && !availability.available) return;
      onChange(promotion._id, promotion);
      setIsOpen(false);
      setSearch("");
    },
    [getPromotionAvailability, onChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange("", undefined);
    },
    [onChange]
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex w-full items-center justify-between rounded-lg border bg-gray-700 px-3 py-2.5 text-left transition ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:border-purple-500"
        } ${isOpen ? "border-purple-500 ring-2 ring-purple-500/20" : "border-gray-600"}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          {selectedPromotion ? (
            <>
              <span className="truncate text-sm font-medium text-white">
                {selectedPromotion.name}
              </span>
              <span className="text-xs text-gray-400">
                ({selectedPromotion.comboItems?.length || 0} items)
              </span>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <div
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClear(e as any);
                }
              }}
              className="cursor-pointer rounded p-0.5 hover:bg-gray-600"
            >
              <Check className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <ChevronDown
            className={`h-5 w-5 text-gray-400 transition ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="rounded-lg border border-gray-600 bg-gray-800 shadow-2xl"
        >
          <div className="border-b border-gray-700 p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar promocion..."
                className="w-full rounded-lg border border-gray-600 bg-gray-700 py-2 pl-9 pr-4 text-sm text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-gray-700 px-3 py-2">
            <span className="text-xs text-gray-400">Promociones</span>
            <span className="text-xs text-gray-500">
              {filteredPromotions.length} disponibles
            </span>
          </div>

          <div className="scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 max-h-96 overflow-y-auto">
            {filteredPromotions.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                No se encontraron promociones
              </div>
            ) : (
              <div className="py-1">
                {filteredPromotions.map(promo => {
                  const availability = getPromotionAvailability?.(promo);
                  const isAvailable = availability?.available !== false;
                  const reason = availability?.reason || "";

                  return (
                    <button
                      key={promo._id}
                      type="button"
                      onClick={() => handleSelect(promo)}
                      disabled={!isAvailable}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${
                        value === promo._id ? "bg-purple-500/20" : ""
                      } ${
                        isAvailable
                          ? "hover:bg-gray-700"
                          : "cursor-not-allowed opacity-60"
                      }`}
                    >
                      {promo.image?.url ? (
                        <img
                          src={promo.image.url}
                          alt=""
                          className="h-8 w-8 rounded object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-700">
                          <Package className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-white">
                            {promo.name}
                          </span>
                          {value === promo._id && (
                            <Check className="h-4 w-4 text-purple-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400">
                            {promo.comboItems?.length || 0} productos
                          </span>
                          {promo.status && (
                            <span className="text-gray-500">
                              {promo.status}
                            </span>
                          )}
                          {!isAvailable && reason && (
                            <span className="text-amber-300">{reason}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-400">
                        ${formatPrice(promo).toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
