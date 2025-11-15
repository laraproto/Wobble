import reactLogo from "@/react.svg";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function Home() {
  return (
    <div className="container mx-auto p-8 text-center relative z-10">
      <div className="flex lg:flex-row flex-col ">
        <img
          src={reactLogo}
          alt="React Logo"
          className="h-36 p-6 transition-all duration-300 hover:drop-shadow-[0_0_2em_#61dafbaa] animate-[spin_20s_linear_infinite]"
        />
        <ul className="lg:ml-6 flex flex-col justify-center gap-2 w-120">
          <li className="grid gap-2 text-4xl pb-4 font-bold">Wobble</li>
          <li>
            Small, easy to use discord bot, just download and run (Logo is just
            react logo, so placeholder)
          </li>
          <li>
            <div className="flex flex-row justify-center pt-4">
              <Button asChild>
                <a href="/api/auth">Get Started</a>
              </Button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
