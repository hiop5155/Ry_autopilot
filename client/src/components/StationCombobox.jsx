// client/src/components/StationCombobox.jsx
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { useI18n } from "../context/I18nContext";

export default function StationCombobox({
  label,
  value,
  onChange,
  stations = [],
  placeholder,
  disabled = false,
}) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  // 取得當前選定車站之展示名稱 (例如: "1000 - 臺北")
  const currentStation = stations.find((s) => s.code === value);
  const currentDisplay = currentStation ? `${currentStation.code}-${currentStation.name}` : "";

  // 點擊外部自動關閉
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // 過濾車站列表 (依站名或代碼)
  const filtered = stations.filter((st) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    return st.name.toLowerCase().includes(term) || st.code.includes(term);
  });

  const handleSelect = (st) => {
    onChange(st.code);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative flex-1 min-w-0" ref={wrapperRef}>
      {label && <label className="block text-xs font-semibold text-slate-400 mb-1.5">{label}</label>}

      <div className="relative flex items-center">
        <div className="absolute left-3 text-cyan-400 pointer-events-none">
          <MapPin className="w-4 h-4" />
        </div>

        <input
          type="text"
          disabled={disabled}
          value={isOpen ? searchTerm : currentDisplay}
          placeholder={isOpen ? t("search_station_ph") : (placeholder || t("start_station_ph"))}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
              setSearchTerm("");
            }
          }}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          className={`w-full pl-9 pr-8 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm md:text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all ${
            disabled ? "opacity-60 cursor-not-allowed" : "cursor-text"
          }`}
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen((prev) => !prev);
              setSearchTerm("");
            }
          }}
          className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180 text-cyan-400" : ""}`} />
        </button>
      </div>

      {/* 下拉面板 */}
      {isOpen && !disabled && (
        <ul className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto bg-slate-900 border border-cyan-500/40 rounded-xl shadow-2xl z-50 divide-y divide-slate-800/60 animate-in fade-in zoom-in-95 duration-150">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-center text-xs text-slate-500">{t("station_not_found")}</li>
          ) : (
            filtered.map((st) => {
              const isSelected = st.code === value;
              return (
                <li
                  key={st.code}
                  onClick={() => handleSelect(st)}
                  className={`flex items-center justify-between px-3.5 py-2.5 text-sm cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="font-medium">{st.name}</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800/80 text-cyan-400 border border-slate-700">
                    {st.code}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
