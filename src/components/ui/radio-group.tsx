import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupContextValue {
  value?: string
  name: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null)

interface RadioGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
  disabled?: boolean
}

let radioGroupCounter = 0

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ value, onValueChange, className, children, disabled, ...props }, ref) => {
    const nameRef = React.useRef(`radio-group-${++radioGroupCounter}`)
    
    return (
      <RadioGroupContext.Provider value={{ value, name: nameRef.current, onValueChange, disabled }}>
        <div
          ref={ref}
          role="radiogroup"
          className={cn("grid gap-2", className)}
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps {
  value: string
  id: string
  className?: string
  disabled?: boolean
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ value, id, className, disabled: itemDisabled, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext)
    
    if (!context) {
      throw new Error("RadioGroupItem must be used within a RadioGroup")
    }
    
    const { value: selectedValue, name, onValueChange, disabled: groupDisabled } = context
    const isDisabled = itemDisabled || groupDisabled
    
    return (
      <input
        ref={ref}
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={selectedValue === value}
        onChange={() => onValueChange?.(value)}
        disabled={isDisabled}
        className={cn(
          "aspect-square h-4 w-4 rounded-full border border-gray-300 text-primary accent-blue-600 focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
