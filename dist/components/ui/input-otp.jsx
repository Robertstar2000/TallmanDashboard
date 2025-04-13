'use client';
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import * as React from 'react';
import { OTPInput, OTPInputContext } from 'input-otp';
import { Dot } from 'lucide-react';
import { cn } from '@/lib/utils';
const InputOTP = React.forwardRef((_a, ref) => {
    var { className, containerClassName } = _a, props = __rest(_a, ["className", "containerClassName"]);
    return (<OTPInput ref={ref} containerClassName={cn('flex items-center gap-2 has-[:disabled]:opacity-50', containerClassName)} className={cn('disabled:cursor-not-allowed', className)} {...props}/>);
});
InputOTP.displayName = 'InputOTP';
const InputOTPGroup = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<div ref={ref} className={cn('flex items-center', className)} {...props}/>);
});
InputOTPGroup.displayName = 'InputOTPGroup';
const InputOTPSlot = React.forwardRef((_a, ref) => {
    var { index, className } = _a, props = __rest(_a, ["index", "className"]);
    const inputOTPContext = React.useContext(OTPInputContext);
    const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];
    return (<div ref={ref} className={cn('relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md', isActive && 'z-10 ring-2 ring-ring ring-offset-background', className)} {...props}>
      {char}
      {hasFakeCaret && (<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000"/>
        </div>)}
    </div>);
});
InputOTPSlot.displayName = 'InputOTPSlot';
const InputOTPSeparator = React.forwardRef((_a, ref) => {
    var props = __rest(_a, []);
    return (<div ref={ref} role="separator" {...props}>
    <Dot />
  </div>);
});
InputOTPSeparator.displayName = 'InputOTPSeparator';
export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
