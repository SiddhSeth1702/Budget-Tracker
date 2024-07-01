export const Currencies = [
    { value: "USD", label: "$ Dollar", locale: "en-US" },
    { value: "INR", label: "₹ Indian Rupees", locale: "en-IN" },
    { value: "EUR", label: "€ Euros", locale: "en-US" },
    { value: "GBP", label: "£ Pound", locale: "en-GB" }
]

export type Currency = (typeof Currencies)[0];