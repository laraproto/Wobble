import reactLogo from "@/react.svg";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@lib/trpc";
import { Link } from "wouter";

export function Home() {
  const configurationQuery = useQuery(trpc.configuration.queryOptions());
  const helloQuery = useQuery(trpc.hello.queryOptions({}));

  return (
    <div className="container mx-auto p-8 text-center relative z-10">
      <div className="flex lg:flex-row flex-col ">
        <img
          src={reactLogo}
          alt="React Logo"
          className="h-48 p-6 transition-all duration-300 hover:drop-shadow-[0_0_2em_#61dafbaa] animate-[spin_20s_linear_infinite]"
        />
        <ul className="lg:ml-6 flex flex-col justify-center gap-2 w-120">
          <li className="grid gap-2 text-4xl pb-4 font-bold">Wobble</li>
          <li>
            Small, easy to use discord bot, just download and run (Logo is just
            react logo, so placeholder)
          </li>
          <li>
            {helloQuery.isLoading ? (
              <span>Loading...</span>
            ) : (
              <span>{helloQuery.data}</span>
            )}
          </li>
          <li>
            <div className="flex flex-row justify-center pt-4 space-x-4">
              {configurationQuery.isLoading ? (
                <span>Hold a sec.</span>
              ) : (
                <>
                  <Button asChild>
                    <a href="/api/auth/redirect">Dashboard</a>
                  </Button>
                  {!configurationQuery.data?.installed && (
                    <Button asChild>
                      <Link href="/installer">Installer</Link>
                    </Button>
                  )}
                </>
              )}
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
