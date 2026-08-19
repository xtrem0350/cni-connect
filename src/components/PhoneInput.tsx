import { forwardRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { extractPhoneParts, getCountryByDialCode } from "@/utils/phone";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  defaultCountry?: string;
}

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const countries: Country[] = [
  { code: "CI", name: "Côte d'Ivoire", dialCode: "+225", flag: "🇨🇮" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "SN", name: "Sénégal", dialCode: "+221", flag: "🇸🇳" },
  { code: "ML", name: "Mali", dialCode: "+223", flag: "🇲🇱" },
  { code: "BF", name: "Burkina Faso", dialCode: "+226", flag: "🇧🇫" },
  { code: "GH", name: "Ghana", dialCode: "+233", flag: "🇬🇭" },
  { code: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬" },
  { code: "CM", name: "Cameroun", dialCode: "+237", flag: "🇨🇲" },
  { code: "BJ", name: "Bénin", dialCode: "+229", flag: "🇧🇯" },
  { code: "TG", name: "Togo", dialCode: "+228", flag: "🇹🇬" },
  { code: "US", name: "États-Unis", dialCode: "+1", flag: "🇺🇸" },
  { code: "GB", name: "Royaume-Uni", dialCode: "+44", flag: "🇬🇧" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "BE", name: "Belgique", dialCode: "+32", flag: "🇧🇪" },
  { code: "CH", name: "Suisse", dialCode: "+41", flag: "🇨🇭" },
  { code: "DZ", name: "Algérie", dialCode: "+213", flag: "🇩🇿" },
  { code: "MA", name: "Maroc", dialCode: "+212", flag: "🇲🇦" },
  { code: "TN", name: "Tunisie", dialCode: "+216", flag: "🇹🇳" },
];

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    { value, onChange, placeholder = "07 01 01 01 23", className, disabled, defaultCountry = "CI" },
    ref,
  ) => {
    const initialCountry =
      countries.find((country) => country.code === defaultCountry) ?? countries[0];
    const [selectedCountry, setSelectedCountry] = useState<Country>(initialCountry);

    useEffect(() => {
      const countryCode = getCountryByDialCode(extractPhoneParts(value).dialCode);
      const country = countries.find((item) => item.code === countryCode);
      if (country && country.code !== selectedCountry.code) {
        setSelectedCountry(country);
      }
    }, [selectedCountry.code, value]);

    const handleCountryChange = (countryCode: string) => {
      const country = countries.find((item) => item.code === countryCode);
      if (!country) return;

      setSelectedCountry(country);
      const { number } = extractPhoneParts(value);
      onChange(`${country.dialCode}${number.replace(/\D/g, "")}`);
    };

    const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(`${selectedCountry.dialCode}${event.target.value.replace(/\D/g, "")}`);
    };

    const { number } = extractPhoneParts(value);

    return (
      <div className="flex gap-1">
        <Select
          value={selectedCountry.code}
          onValueChange={handleCountryChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-[140px] flex-shrink-0">
            <SelectValue>
              <span className="flex items-center gap-2">
                <span>{selectedCountry.flag}</span>
                <span>{selectedCountry.dialCode}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <span className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{country.dialCode}</span>
                  <span className="text-xs text-muted-foreground">{country.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          ref={ref}
          type="tel"
          value={number}
          onChange={handleNumberChange}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
          inputMode="numeric"
        />
      </div>
    );
  },
);

PhoneInput.displayName = "PhoneInput";
