import type { ComponentProps } from "react";
import { Button } from "./button";

type IconProps = ComponentProps<"svg">;

export function XIcon({ className, ...props }: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 1200 1227"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
    </svg>
  );
}

export function FacebookIcon({ className, ...props }: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 2084 2084"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M2083.333,1041.667c0,-575.296 -466.371,-1041.667 -1041.667,-1041.667c-575.296,0 -1041.667,466.371 -1041.667,1041.667c0,488.521 336.312,898.425 790.025,1010.992l0,-692.675l-214.8,0l0,-318.317l214.8,0l0,-137.163c0,-354.55 160.45,-518.883 508.533,-518.883c65.992,0 179.862,12.938 226.446,25.879l0,288.558c-24.588,-2.587 -67.287,-3.883 -120.342,-3.883c-170.804,0 -236.8,64.7 -236.8,232.917l0,112.575l340.246,0l-58.45,318.317l-281.796,0l0,715.721c515.775,-62.296 915.471,-501.462 915.471,-1034.037"
        fill="#0866ff"
        fillRule="nonzero"
      />
      <path
        d="M1449.656,1359.985l58.454,-318.317l-340.246,0l0,-112.579c0,-168.217 65.992,-232.912 236.796,-232.912c53.054,0 95.754,1.292 120.342,3.879l0,-288.554c-46.583,-12.942 -160.454,-25.883 -226.446,-25.883c-348.079,0 -508.533,164.337 -508.533,518.887l0,137.162l-214.8,0l0,318.317l214.8,0l0,692.675c80.596,19.992 164.867,30.675 251.642,30.675c42.725,0 84.825,-2.633 126.2,-7.629l0,-715.721l281.792,0Z"
        fill="#ffffff"
        fillRule="nonzero"
      />
    </svg>
  );
}

export function SocialButton({
  className,
  ...props
}: ComponentProps<"button">) {
  return (
    <Button
      appearance="outline"
      className={`social-button ${className || ""}`.trim()}
      {...props}
    />
  );
}
