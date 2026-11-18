import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** نص بديل لقارئ الشاشة — إلزامي لأن الحقل بلا تسمية ظاهرة. */
  label: string;
}

/** حقل بحث موحّد الشكل. التأخير (debounce) مسؤولية الصفحة عبر useDebouncedValue. */
export default function SearchInput({
  value,
  onChange,
  placeholder = "ابحث…",
  label,
}: SearchInputProps) {
  return (
    <div className="input-wrap filter">
      <Search aria-hidden="true" />
      <input
        className="input"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        spellCheck={false}
      />
    </div>
  );
}
