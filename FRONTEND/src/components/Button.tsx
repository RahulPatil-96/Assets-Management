const variantClasses = {
  "primary": "bg-purple-600 text-white hover:bg-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 transition duration-200 ease-in-out",
  "secondary": "bg-purple-200 text-purple-600 hover:bg-purple-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 transition duration-200 ease-in-out",
  "gradient": "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition duration-200 ease-in-out",
};

const defaultStyles = "p-2 px-4 py-2 rounded-md font-light flex items-center justify-center";

type ButtonVariant = keyof typeof variantClasses;

interface ButtonProps {
  variant?: ButtonVariant;
  text: string;
  startIcon?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  text,
  startIcon,
  onClick,
  fullWidth,
  loading,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={
        variantClasses[variant] +
        " " +
        defaultStyles +
        (fullWidth ? " w-full" : "") +
        (loading ? " opacity-50 cursor-not-allowed" : " cursor-pointer")
      }
      disabled={loading}
      aria-busy={loading}
    >
      {startIcon && <span className="mr-2 flex items-center">{startIcon}</span>}
      {text}
    </button>
  );
}
