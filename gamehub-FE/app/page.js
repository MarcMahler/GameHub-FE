import Image from "next/image";
import "./page.css";
import {Nav} from "@/app/components/Nav/nav";

export default function Home() {
  return (
    <div className={"page"}>
        <Nav />
      <main className={"main"}>
        <Image
          className={"logo"}
          src="/tictac.png"
          alt="Next.js logo"
          width={280}
          height={250}
          priority
        />
      </main>
    </div>
  );
}
