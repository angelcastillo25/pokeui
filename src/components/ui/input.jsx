import * as React from "react";
import { cn } from "@/lib/utils";

const InputWithLabel = React.forwardRef(function InputWithLabel(
  {
    label,
    id,
    className,
    inputClassName,
    labelClassName,
    value,
    onChange,
    ...props
  },
  ref
) {
  const [error, setError] = React.useState("");

  const handleChange = (e) => {
    const inputValue = e.target.value;
    
    // Validación: debe ser un entero positivo (incluyendo "0" o vacío para permitir borrado)
    if (inputValue === "" || /^[0-9]+$/.test(inputValue)) {
      setError(""); // Limpiar error si es válido
      if (onChange) onChange(e); // Propagamos el evento onChange si existe
    } else {
      setError("Por favor, ingresa un número entero positivo."); // Mensaje de error
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <label
          htmlFor={id}
          className={cn(
            "text-sm font-medium text-muted-foreground whitespace-nowrap",
            labelClassName
          )}
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          value={value}
          onChange={handleChange}
          className={cn(
            "flex h-9 max-w-60 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500", // Estilo de error
            inputClassName
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p> // Mostrar mensaje de error
      )}
    </div>
  );
});

export { InputWithLabel };